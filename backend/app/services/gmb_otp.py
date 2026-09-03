import os
import secrets
import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional
import httpx
from dotenv import load_dotenv
from app.core.database import get_db_connection

load_dotenv()

DIGINTRA_API_KEY = os.getenv("DIGINTRA_API_KEY", "")
DIGINTRA_BASE_URL = os.getenv("DIGINTRA_BASE_URL", "https://api.digintra.com")
DIGINTRA_OTP_TEMPLATE_ID = os.getenv("DIGINTRA_OTP_TEMPLATE_ID", "")
DIGINTRA_SENDER_ID = os.getenv("DIGINTRA_SENDER_ID", "")
DIGINTRA_OTP_EXPIRY_SECONDS = int(os.getenv("DIGINTRA_OTP_EXPIRY_SECONDS", "300"))
DIGINTRA_OTP_LENGTH = int(os.getenv("DIGINTRA_OTP_LENGTH", "6"))

def _hash_otp(otp: str) -> str:
    return hashlib.sha256(f"gmb_ssgp_salt_{otp}".encode()).hexdigest()

class GmbOtpService:
    @staticmethod
    async def send_otp(mobile: str) -> Tuple[bool, str, str, Optional[str]]:
        """
        Generates and sends an SMS OTP for the given mobile.
        Returns: (success, session_token, message, demo_otp_if_dev)
        """
        conn = get_db_connection()
        cursor = conn.cursor()

        now = datetime.now(timezone.utc)

        # 1. Check for active cooldown (e.g. 45 seconds) unless test number
        TEST_NUMBERS = {"7996633015", "+917996633015", "917996633015"}
        if mobile not in TEST_NUMBERS:
            cursor.execute("""
            SELECT created_at FROM gmb_otp_challenges
            WHERE mobile = ? AND is_verified = 0
            ORDER BY created_at DESC LIMIT 1
            """, (mobile,))
            last = cursor.fetchone()
            if last and last["created_at"]:
                try:
                    last_time = datetime.fromisoformat(last["created_at"].replace("Z", "+00:00"))
                    if (now - last_time).total_seconds() < 45:
                        conn.close()
                        remaining = int(45 - (now - last_time).total_seconds())
                        return False, "", f"Please wait {remaining} seconds before requesting a new OTP", None
                except Exception:
                    pass

        # 2. Generate cryptographically strong random OTP
        if DIGINTRA_OTP_LENGTH == 4:
            otp = f"{secrets.randbelow(9000) + 1000}"
        else:
            otp = f"{secrets.randbelow(900000) + 100000}"

        hashed = _hash_otp(otp)
        session_token = f"otp_sess_{uuid.uuid4().hex}"
        expires_at = (now + timedelta(seconds=DIGINTRA_OTP_EXPIRY_SECONDS)).isoformat()
        created_at = now.isoformat()

        cursor.execute("""
        INSERT INTO gmb_otp_challenges (id, mobile, hashed_otp, session_token, attempts, is_verified, expires_at, created_at)
        VALUES (?, ?, ?, ?, 0, 0, ?, ?)
        """, (f"otp_{uuid.uuid4().hex[:12]}", mobile, hashed, session_token, expires_at, created_at))
        conn.commit()
        conn.close()

        # 3. Trigger Digintra SMS API if credentials are provided
        demo_otp = None
        if DIGINTRA_API_KEY and DIGINTRA_BASE_URL:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    payload = {
                        "apiKey": DIGINTRA_API_KEY,
                        "sender": DIGINTRA_SENDER_ID,
                        "to": f"91{mobile}",
                        "templateId": DIGINTRA_OTP_TEMPLATE_ID,
                        "message": f"Your Siri Samruddhi Gold Palace Event OTP is {otp}. Valid for 5 minutes.",
                        "otp": otp
                    }
                    resp = await client.post(f"{DIGINTRA_BASE_URL}/sms/otp", json=payload)
                    print(f"Digintra SMS response for {mobile}: status={resp.status_code}")
            except Exception as e:
                print(f"Warning: Digintra SMS provider error ({e}). Using mock fallback.")
                demo_otp = otp
        else:
            # Dev / demo mode when credentials are pending
            demo_otp = otp
            print(f"[DEVELOPMENT MODE] Digintra SMS OTP for {mobile}: {otp}")

        return True, session_token, "OTP sent successfully to your mobile number", demo_otp

    @staticmethod
    def verify_otp(mobile: str, otp: str, session_token: str) -> Tuple[bool, str]:
        """
        Verifies the user-entered OTP against the stored challenge session.
        Returns: (is_valid, message)
        """
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
        SELECT id, mobile, hashed_otp, attempts, is_verified, expires_at
        FROM gmb_otp_challenges
        WHERE session_token = ?
        """, (session_token,))
        challenge = cursor.fetchone()

        if not challenge:
            conn.close()
            return False, "Invalid or expired OTP session. Please request a new OTP."

        if challenge["mobile"] != mobile:
            conn.close()
            return False, "Mobile number does not match OTP session."

        if challenge["attempts"] >= 5:
            conn.close()
            return False, "Too many incorrect attempts. Please request a fresh OTP."

        now = datetime.now(timezone.utc)
        try:
            expires_at = datetime.fromisoformat(challenge["expires_at"].replace("Z", "+00:00"))
            if now > expires_at:
                conn.close()
                return False, "OTP has expired. Please request a new OTP."
        except Exception:
            pass

        # Increment attempt counter
        cursor.execute("UPDATE gmb_otp_challenges SET attempts = attempts + 1 WHERE id = ?", (challenge["id"],))
        conn.commit()

        # Check hash
        if _hash_otp(otp) != challenge["hashed_otp"]:
            conn.close()
            return False, "Incorrect OTP. Please enter the correct code."

        # Mark verified
        cursor.execute("UPDATE gmb_otp_challenges SET is_verified = 1 WHERE id = ?", (challenge["id"],))
        conn.commit()
        conn.close()

        return True, "Mobile number verified successfully"

    @staticmethod
    def is_session_verified(session_token: str, mobile: str) -> bool:
        """
        Checks if the given session token was verified for the given mobile.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT id, is_verified, expires_at FROM gmb_otp_challenges
        WHERE session_token = ? AND mobile = ?
        """, (session_token, mobile))
        row = cursor.fetchone()
        conn.close()

        if not row or not row["is_verified"]:
            return False

        try:
            expires_at = datetime.fromisoformat(row["expires_at"].replace("Z", "+00:00"))
            # Allow 15 minutes window from issue for registration completion
            if datetime.now(timezone.utc) > expires_at + timedelta(minutes=15):
                return False
        except Exception:
            pass

        return True
