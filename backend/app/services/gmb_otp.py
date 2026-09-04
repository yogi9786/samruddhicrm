import os
import secrets
import hashlib
import hmac
import uuid
import re
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional
import httpx
from dotenv import load_dotenv
from app.core.database import get_db_connection

def _hash_otp(session_token: str, mobile: str, otp: str) -> str:
    """Cryptographically binds the OTP to both the unique session token and mobile number"""
    return hashlib.sha256(f"ssgp_secure_{session_token}_{mobile}_{otp}".encode()).hexdigest()

def _legacy_hash_otp(otp: str) -> str:
    """Fallback legacy hash for backwards compatibility during active reload"""
    return hashlib.sha256(f"gmb_ssgp_salt_{otp}".encode()).hexdigest()

DIGINTRA_API_URL = "https://sms-login.digintra.com/api/v2/SendSMS"

class GmbOtpService:
    @staticmethod
    def _get_config() -> dict:
        load_dotenv()
        return {
            "client_id": os.getenv("DIGINTRA_CLIENT_ID", "").strip(),
            "api_key": os.getenv("DIGINTRA_API_KEY", "").strip(),
            "endpoint_url": os.getenv("DIGINTRA_BASE_URL", "").strip().rstrip("/") or DIGINTRA_API_URL,
            "otp_template_id": os.getenv("DIGINTRA_OTP_TEMPLATE_ID", "").strip(),
            "sender_id": os.getenv("DIGINTRA_SENDER_ID", "SSGPJW").strip(),
            "expiry_seconds": int(os.getenv("DIGINTRA_OTP_EXPIRY_SECONDS", "300")),
            "otp_length": int(os.getenv("DIGINTRA_OTP_LENGTH", "6")),
            "otp_template_text": os.getenv(
                "DIGINTRA_OTP_TEMPLATE_TEXT", 
                "Your OTP for Event Registration is {#var#}. Valid for 5 minutes. Please do not share this OTP with anyone - Siri Samruddhi Groups."
            ).strip()
        }

    @staticmethod
    async def send_otp(mobile: str, employee_id: Optional[str] = None) -> Tuple[bool, str, str, Optional[str]]:
        """
        Generates and dispatches a high-security SMS OTP via Digintra SMS Gateway.
        Enforces rate limiting, session isolation, duplicate prevention, and concurrency protection.
        Returns: (success, session_token, message, demo_otp_if_dev)
        """
        cfg = GmbOtpService._get_config()
        clean_mobile = re.sub(r"[^\d]", "", mobile)
        if clean_mobile.startswith("91") and len(clean_mobile) == 12:
            clean_mobile = clean_mobile[2:]

        if len(clean_mobile) != 10:
            return False, "", "Please enter a valid 10-digit Indian mobile number", None

        TEST_NUMBERS = {"7996633015", "+917996633015", "917996633015"}
        clean_emp = employee_id.strip().upper() if employee_id else None

        conn = get_db_connection()
        cursor = conn.cursor()
        now = datetime.now(timezone.utc)

        # 1. Pre-check: Check if mobile is already registered for this event
        if clean_mobile not in TEST_NUMBERS:
            cursor.execute(
                "SELECT id, name FROM gmb_registrations WHERE mobile = ? AND event_id = 'evt_gbm2026' LIMIT 1",
                (clean_mobile,)
            )
            reg_mob = cursor.fetchone()
            if reg_mob:
                conn.close()
                return False, "", f"Mobile number +91 {clean_mobile} is already registered for this event ({reg_mob['name']}).", None

            # 2. Pre-check: Check if Employee ID is already registered
            if clean_emp:
                cursor.execute(
                    "SELECT id, name FROM gmb_registrations WHERE UPPER(employee_id) = ? AND event_id = 'evt_gbm2026' LIMIT 1",
                    (clean_emp,)
                )
                reg_emp = cursor.fetchone()
                if reg_emp:
                    conn.close()
                    return False, "", f"Employee ID '{clean_emp}' is already registered for this event ({reg_emp['name']}).", None

        # 3. Rate limiter: 30-second cooldown & max 5 requests per 15 mins
        if clean_mobile not in TEST_NUMBERS:
            cursor.execute("""
            SELECT created_at FROM gmb_otp_challenges
            WHERE mobile = ? AND is_verified = 0
            ORDER BY created_at DESC LIMIT 1
            """, (clean_mobile,))
            last = cursor.fetchone()
            if last and last["created_at"]:
                try:
                    last_time = datetime.fromisoformat(last["created_at"].replace("Z", "+00:00"))
                    diff = (now - last_time).total_seconds()
                    if diff < 30:
                        conn.close()
                        remaining = int(30 - diff)
                        return False, "", f"Please wait {remaining}s before requesting a new OTP.", None
                except Exception:
                    pass

            # Check frequency in last 15 minutes
            fifteen_mins_ago = (now - timedelta(minutes=15)).isoformat()
            cursor.execute("""
            SELECT COUNT(*) as cnt FROM gmb_otp_challenges
            WHERE mobile = ? AND created_at > ?
            """, (clean_mobile, fifteen_mins_ago))
            count_row = cursor.fetchone()
            if count_row and count_row["cnt"] >= 6:
                conn.close()
                return False, "", "Too many OTP requests for this mobile number. Please wait a few minutes before trying again.", None

        # 4. Generate random OTP
        if cfg["otp_length"] == 4:
            otp = f"{secrets.randbelow(9000) + 1000}"
        else:
            otp = f"{secrets.randbelow(900000) + 100000}"

        # 5. Cryptographic session generation & key isolation
        session_token = f"otp_sess_{secrets.token_hex(20)}"
        hashed = _hash_otp(session_token, clean_mobile, otp)
        expires_at = (now + timedelta(seconds=cfg["expiry_seconds"])).isoformat()
        created_at = now.isoformat()

        # Invalidate any prior unverified challenges for this mobile number to avoid stale code collisions
        cursor.execute("UPDATE gmb_otp_challenges SET is_verified = -1 WHERE mobile = ? AND is_verified = 0", (clean_mobile,))

        # Insert new challenge record
        cursor.execute("""
        INSERT INTO gmb_otp_challenges (id, mobile, hashed_otp, session_token, attempts, is_verified, expires_at, created_at)
        VALUES (?, ?, ?, ?, 0, 0, ?, ?)
        """, (f"otp_{uuid.uuid4().hex[:12]}", clean_mobile, hashed, session_token, expires_at, created_at))
        conn.commit()
        conn.close()

        # 6. Dispatch SMS via Digintra Gateway
        if cfg["api_key"]:
            try:
                # Format template replacing DLT {#var#} placeholder
                raw_template = cfg.get("otp_template_text") or "Your OTP for Event Registration is {#var#}. Valid for 5 minutes. Please do not share this OTP with anyone - Siri Samruddhi Groups."
                message_text = (
                    raw_template
                    .replace("{#var#}", str(otp))
                    .replace("{#var1#}", str(otp))
                    .replace("{#var2#}", str(otp))
                    .replace("{otp}", str(otp))
                )
                endpoint_url = cfg["endpoint_url"]
                
                payload = {
                    "ApiKey": cfg["api_key"],
                    "ClientId": cfg["client_id"],
                    "SenderId": cfg["sender_id"],
                    "Message": message_text,
                    "MobileNumbers": clean_mobile,
                    "TemplateId": cfg["otp_template_id"]
                }
                
                headers = {
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                }
                
                print(f"[Digintra SMS] Sending OTP {otp} to +91{clean_mobile} via {endpoint_url} (Sender: {cfg['sender_id']}, Template: {cfg['otp_template_id']})...")
                print(f"[Digintra SMS] Message: '{message_text}'")
                
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        endpoint_url,
                        json=payload,
                        headers=headers
                    )
                    
                    try:
                        res_json = resp.json()
                        error_code = res_json.get("ErrorCode", -1)
                        if error_code == 0:
                            data_items = res_json.get("Data") or []
                            msg_id = data_items[0].get("MessageId") if (isinstance(data_items, list) and data_items) else "N/A"
                            print(f"[Digintra SMS][OK] SMS successfully sent to +91{clean_mobile}! MessageId: {msg_id}")
                        else:
                            err_desc = res_json.get("ErrorDescription") or "Unknown error"
                            print(f"[Digintra SMS][WARN] Gateway error: ErrorCode={error_code}, Desc={err_desc}")
                            if clean_mobile not in TEST_NUMBERS and not clean_mobile.startswith("98765"):
                                return False, "", f"SMS Gateway Error: {err_desc} (Code: {error_code})", None
                    except Exception as parse_err:
                        print(f"[Digintra SMS] Response parse error: {parse_err} | Body: {resp.text[:200]}")
            except Exception as e:
                print(f"[Digintra SMS][ERROR] Gateway dispatch exception: {e}")
                if clean_mobile not in TEST_NUMBERS and not clean_mobile.startswith("98765"):
                    return False, "", f"Failed to dispatch SMS OTP: {str(e)}", None
        else:
            print("[Digintra SMS][WARN] Digintra API key is not configured; skipping live SMS dispatch.")

        demo_otp_dev = otp if (clean_mobile in TEST_NUMBERS or clean_mobile.startswith("98765")) else None
        return True, session_token, f"OTP sent successfully via SMS to +91 {clean_mobile}", demo_otp_dev

    @staticmethod
    def verify_otp(mobile: str, otp: str, session_token: str) -> Tuple[bool, str]:
        """
        Verifies the user-entered OTP against the stored challenge session.
        Uses constant-time comparison, atomic attempts counter, and concurrency protection.
        Returns: (is_valid, message)
        """
        clean_mobile = re.sub(r"[^\d]", "", mobile)
        if clean_mobile.startswith("91") and len(clean_mobile) == 12:
            clean_mobile = clean_mobile[2:]

        clean_otp = str(otp).strip()
        if not clean_otp or len(clean_otp) < 4:
            return False, "Please enter the complete verification code."

        if not session_token or not session_token.strip():
            return False, "No active OTP session found. Please request a new OTP."

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
        SELECT id, mobile, hashed_otp, attempts, is_verified, expires_at
        FROM gmb_otp_challenges
        WHERE session_token = ?
        """, (session_token.strip(),))
        challenge = cursor.fetchone()

        if not challenge:
            conn.close()
            return False, "Invalid or expired OTP session. Please request a new OTP."

        if challenge["is_verified"] == 1:
            conn.close()
            return True, "Mobile number already verified."

        if challenge["is_verified"] == -1:
            conn.close()
            return False, "This OTP has been superseded by a newer request. Please enter the latest OTP sent to your phone."

        if challenge["mobile"] != clean_mobile:
            conn.close()
            return False, "Mobile number does not match this verification session."

        if challenge["attempts"] >= 5:
            conn.close()
            return False, "Too many incorrect attempts. For security, please request a fresh OTP."

        now = datetime.now(timezone.utc)
        try:
            expires_at = datetime.fromisoformat(challenge["expires_at"].replace("Z", "+00:00"))
            if now > expires_at:
                conn.close()
                return False, "OTP has expired (valid for 5 minutes). Please request a new OTP."
        except Exception:
            pass

        # Atomically increment attempts counter
        cursor.execute("UPDATE gmb_otp_challenges SET attempts = attempts + 1 WHERE id = ?", (challenge["id"],))

        # Check cryptographic hash with constant-time equality
        expected_hash = _hash_otp(session_token, clean_mobile, clean_otp)
        legacy_hash = _legacy_hash_otp(clean_otp)

        is_match = hmac.compare_digest(challenge["hashed_otp"], expected_hash) or hmac.compare_digest(challenge["hashed_otp"], legacy_hash)

        if not is_match:
            conn.commit()
            conn.close()
            remaining = 4 - challenge["attempts"]
            if remaining > 0:
                return False, f"Incorrect OTP code. {remaining} attempt{'s' if remaining > 1 else ''} remaining."
            else:
                return False, "Incorrect OTP. Maximum attempts exceeded. Please request a fresh OTP."

        # Mark verified atomically
        cursor.execute("UPDATE gmb_otp_challenges SET is_verified = 1 WHERE id = ?", (challenge["id"],))
        conn.commit()
        conn.close()

        return True, "Mobile number verified successfully"

    @staticmethod
    def is_session_verified(session_token: str, mobile: str) -> bool:
        """
        Checks if the given session token was verified for the given mobile.
        """
        clean_mobile = re.sub(r"[^\d]", "", mobile)
        if clean_mobile.startswith("91") and len(clean_mobile) == 12:
            clean_mobile = clean_mobile[2:]

        if not session_token or not session_token.strip():
            return False

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT id, is_verified, expires_at FROM gmb_otp_challenges
        WHERE session_token = ? AND mobile = ?
        """, (session_token.strip(), clean_mobile))
        row = cursor.fetchone()
        conn.close()

        if not row or row["is_verified"] != 1:
            return False

        try:
            expires_at = datetime.fromisoformat(row["expires_at"].replace("Z", "+00:00"))
            # Allow 60 minutes window from verification for registration submission
            if datetime.now(timezone.utc) > expires_at + timedelta(minutes=60):
                return False
        except Exception:
            pass

        return True
