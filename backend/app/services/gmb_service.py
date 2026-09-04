import os
import uuid
import secrets
import hashlib
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, Tuple, List
from app.core.database import get_db_connection
from app.models.gmb import GmbRegistrationCreate, GmbRegistrationResponse
from app.services.gmb_otp import GmbOtpService
from app.services.gmb_pdf import GmbPdfService
from app.services.gmb_comms import AiSensyService, BrevoEmailService

def _mask_aadhaar(aadhaar: str) -> str:
    """Masks 12-digit aadhaar to XXXX XXXX 1234"""
    clean = aadhaar.replace(" ", "").replace("-", "")
    if len(clean) == 12:
        return f"XXXX XXXX {clean[-4:]}"
    return "XXXX XXXX " + clean[-4:]

def _hash_aadhaar(aadhaar: str) -> str:
    salt = "ssgp_aadhaar_salt_2026"
    return hashlib.sha256(f"{salt}{aadhaar.strip()}".encode()).hexdigest()

class GmbService:
    @staticmethod
    def get_branches() -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, company_id, name, code, city FROM gmb_branches WHERE is_active = 1 ORDER BY name ASC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @staticmethod
    def get_companies() -> List[Dict[str, Any]]:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, code FROM gmb_companies WHERE is_active = 1")
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @staticmethod
    def check_employee_authorization(employee_id: str, branch_id: Optional[str] = None) -> Tuple[bool, str]:
        """
        Validates whether an employee ID is whitelisted in the authorized attendee directory.
        If no employees are configured in the whitelist or ENFORCE_EMPLOYEE_WHITELIST is disabled,
        allows registration to proceed smoothly (current phase).
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT COUNT(*) as cnt FROM gmb_authorized_employees WHERE is_active = 1")
            row = cursor.fetchone()
            total_whitelisted = row["cnt"] if row else 0
        except Exception:
            total_whitelisted = 0

        enforce = os.getenv("ENFORCE_EMPLOYEE_WHITELIST", "false").lower() in ("1", "true", "yes")
        if not enforce or total_whitelisted == 0:
            conn.close()
            return True, "Employee ID authorized"

        cursor.execute("""
        SELECT employee_id, full_name, branch_id FROM gmb_authorized_employees
        WHERE UPPER(employee_id) = ? AND is_active = 1
        """, (employee_id.strip().upper(),))
        auth_emp = cursor.fetchone()
        conn.close()

        if not auth_emp:
            return False, f"Employee ID '{employee_id}' is not registered in the authorized company directory. Please contact HR or your branch manager."

        return True, "Employee ID authorized"

    @staticmethod
    async def register_attendee(payload: GmbRegistrationCreate, public_base_url: str) -> GmbRegistrationResponse:
        # 1. Enforce Mobile OTP Verification via SMS
        TEST_NUMBERS = {"7996633015", "+917996633015", "917996633015"}
        if payload.mobile not in TEST_NUMBERS:
            if not payload.otp_session_token or not payload.otp_session_token.strip():
                raise ValueError("Mobile phone verification is required. Please verify your mobile number with SMS OTP.")
            if not GmbOtpService.is_session_verified(payload.otp_session_token, payload.mobile):
                raise ValueError("Mobile OTP verification is required or session has expired. Please verify again.")

        # 2. Check Employee Authorization Whitelist
        is_auth, auth_msg = GmbService.check_employee_authorization(payload.employee_id, payload.branch_id)
        if not is_auth:
            raise ValueError(auth_msg)

        conn = get_db_connection()
        cursor = conn.cursor()

        # 3. Check for duplicate mobile or employee ID for this event
        if payload.mobile in TEST_NUMBERS:
            # Allow unlimited testing for test number by cleaning up prior test registrations
            cursor.execute("SELECT id FROM gmb_registrations WHERE mobile = ?", (payload.mobile,))
            old_rows = cursor.fetchall()
            for r in old_rows:
                old_id = r["id"]
                cursor.execute("DELETE FROM gmb_entry_scans WHERE registration_id = ?", (old_id,))
                cursor.execute("DELETE FROM gmb_gift_redemptions WHERE registration_id = ?", (old_id,))
                cursor.execute("DELETE FROM gmb_scan_logs WHERE registration_id = ?", (old_id,))
                cursor.execute("DELETE FROM gmb_whatsapp_logs WHERE registration_id = ?", (old_id,))
                cursor.execute("DELETE FROM gmb_email_logs WHERE registration_id = ?", (old_id,))
                cursor.execute("DELETE FROM gmb_event_passes WHERE registration_id = ?", (old_id,))
                cursor.execute("DELETE FROM gmb_registrations WHERE id = ?", (old_id,))
            conn.commit()
        else:
            cursor.execute("""
            SELECT id, name, mobile, employee_id FROM gmb_registrations
            WHERE event_id = ? AND (mobile = ? OR employee_id = ?)
            """, (payload.event_id, payload.mobile, payload.employee_id))
            existing = cursor.fetchone()
            if existing:
                conn.close()
                if existing["mobile"] == payload.mobile:
                    raise ValueError("A registration with this mobile number already exists for this event.")
                else:
                    raise ValueError(f"A registration with Employee ID '{payload.employee_id}' already exists for this event.")

        # 3. Retrieve Company & Branch details
        cursor.execute("SELECT name FROM gmb_companies WHERE id = ?", (payload.company_id,))
        comp_row = cursor.fetchone()
        company_name = comp_row["name"] if comp_row else "Siri Samruddhi Gold Palace"

        cursor.execute("SELECT name FROM gmb_branches WHERE id = ?", (payload.branch_id,))
        branch_row = cursor.fetchone()
        branch_name = branch_row["name"] if branch_row else "Yelahanka"

        # 4. Prepare IDs & Tokens
        reg_id = f"reg_{uuid.uuid4().hex[:12]}"
        pass_id = f"pass_{uuid.uuid4().hex[:12]}"
        qr_token = f"EVT-{secrets.token_hex(8).upper()}"
        download_token = f"dl_{secrets.token_urlsafe(16)}"
        now = datetime.now().isoformat() + "Z"

        masked_aadhaar = _mask_aadhaar(payload.aadhaar_number)
        hashed_aadhaar = _hash_aadhaar(payload.aadhaar_number)

        try:
            # 5. Insert Registration
            cursor.execute("""
            INSERT INTO gmb_registrations (
                id, event_id, company_id, branch_id, name, designation, mobile, email,
                aadhaar_masked, aadhaar_hash, employee_id, gender, photo_url,
                registration_status, entry_status, gift_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', 'NOT_ENTERED', 'PENDING', ?)
            """, (
                reg_id, payload.event_id, payload.company_id, payload.branch_id,
                payload.name, payload.designation, payload.mobile, payload.email or "",
                masked_aadhaar, hashed_aadhaar, payload.employee_id, payload.gender.value,
                payload.photo_url, now
            ))

            # 6. Generate PDF Pass File
            pdf_path = GmbPdfService.generate_event_pass_pdf(
                qr_token=qr_token,
                name=payload.name,
                designation=payload.designation,
                employee_id=payload.employee_id,
                branch_name=branch_name,
                company_name=company_name,
                masked_aadhaar=masked_aadhaar,
                gender=payload.gender.value,
                photo_filename=payload.photo_url,
                public_base_url=public_base_url
            )

            # 7. Insert Event Pass Record
            cursor.execute("""
            INSERT INTO gmb_event_passes (
                id, registration_id, qr_token, pdf_path, download_token, is_active, created_at
            ) VALUES (?, ?, ?, ?, ?, 1, ?)
            """, (pass_id, reg_id, qr_token, pdf_path, download_token, now))

            conn.commit()
        except Exception as db_err:
            conn.rollback()
            conn.close()
            raise ValueError(f"Registration failed: {db_err}")
        finally:
            conn.close()

        # URLs
        download_url = f"{public_base_url.rstrip('/')}/api/gbm/pass/{download_token}"
        pass_url = f"{public_base_url.rstrip('/')}/gbm/pass/{qr_token}"

        # 8. Trigger Async Communications (Background Tasks)
        # WhatsApp delivery via AiSensy
        asyncio.create_task(AiSensyService.send_whatsapp_pass(
            registration_id=reg_id,
            mobile=payload.mobile,
            name=payload.name,
            download_url=pass_url
        ))

        # Email delivery via Brevo if email was provided
        if payload.email and payload.email.strip():
            asyncio.create_task(BrevoEmailService.send_email_pass(
                registration_id=reg_id,
                email=payload.email.strip(),
                name=payload.name,
                pdf_path=pdf_path,
                download_url=download_url,
                employee_id=payload.employee_id,
                branch_name=branch_name
            ))

        return GmbRegistrationResponse(
            success=True,
            registration_id=reg_id,
            pass_id=pass_id,
            qr_token=qr_token,
            download_url=download_url,
            pass_url=pass_url,
            name=payload.name,
            branch_name=branch_name,
            message="Event registration successful. Your personalized pass has been generated!",
            whatsapp_status="PENDING",
            email_status="PENDING" if payload.email else "NOT_PROVIDED"
        )

    @staticmethod
    def get_pass_by_token(token: str) -> Optional[Dict[str, Any]]:
        """Finds pass by qr_token or download_token"""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT p.id as pass_id, p.qr_token, p.pdf_path, p.download_token,
               r.id as registration_id, r.name, r.designation, r.employee_id, r.gender,
               r.mobile, r.email, r.aadhaar_masked, r.photo_url, r.entry_status, r.gift_status,
               r.created_at, b.name as branch_name, c.name as company_name
        FROM gmb_event_passes p
        JOIN gmb_registrations r ON p.registration_id = r.id
        JOIN gmb_branches b ON r.branch_id = b.id
        JOIN gmb_companies c ON r.company_id = c.id
        WHERE p.qr_token = ? OR p.download_token = ? OR r.id = ?
        """, (token, token, token))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @staticmethod
    def lookup_qr_for_staff(qr_token: str, staff_id: str = "", scanner_type: str = "GATE") -> Dict[str, Any]:
        """
        Staff lookup for scanning QR.
        Returns attendee details and gift recommendation based on gender.
        """
        data = GmbService.get_pass_by_token(qr_token)
        now = datetime.now().isoformat() + "Z"

        if not data:
            # Log invalid QR scan
            conn = get_db_connection()
            conn.execute("""
            INSERT INTO gmb_scan_logs (id, pass_id, action, result, staff_id, scanner_type, reason, created_at)
            VALUES (?, '', 'INVALID_QR', 'ERROR', ?, ?, 'Scanned QR token was not found', ?)
            """, (f"scan_{uuid.uuid4().hex[:12]}", staff_id, scanner_type, now))
            conn.commit()
            conn.close()
            raise ValueError("Invalid QR code. No active event pass found.")

        # Determine gift recommendation
        gender = data.get("gender", "male").lower()
        suggested_gift_name = "Executive Prestige Gift Set" if gender == "male" else "Pure Silk Saree & Jewelry Box"
        suggested_gift_id = "gift_male" if gender == "male" else "gift_female"

        # Log QR scan attempt
        conn = get_db_connection()
        conn.execute("""
        INSERT INTO gmb_scan_logs (id, pass_id, registration_id, action, result, staff_id, scanner_type, created_at)
        VALUES (?, ?, ?, 'QR_SCANNED', 'SUCCESS', ?, ?, ?)
        """, (f"scan_{uuid.uuid4().hex[:12]}", data["pass_id"], data["registration_id"], staff_id, scanner_type, now))
        conn.commit()
        conn.close()

        return {
            "pass_id": data["pass_id"],
            "registration_id": data["registration_id"],
            "name": data["name"],
            "designation": data["designation"],
            "employee_id": data["employee_id"],
            "gender": data["gender"],
            "company_name": data["company_name"],
            "branch_name": data["branch_name"],
            "photo_url": data["photo_url"],
            "entry_status": data["entry_status"],
            "gift_status": data["gift_status"],
            "masked_aadhaar": data["aadhaar_masked"],
            "suggested_gift_name": suggested_gift_name,
            "suggested_gift_id": suggested_gift_id
        }

    @staticmethod
    def confirm_gate_entry(qr_token: str, staff_id: str, staff_name: str, gate_name: str) -> Dict[str, Any]:
        """
        Confirms attendee gate entry. Prevents duplicate check-in.
        """
        data = GmbService.get_pass_by_token(qr_token)
        now = datetime.now().isoformat() + "Z"

        if not data:
            raise ValueError("Event pass not found")

        reg_id = data["registration_id"]
        pass_id = data["pass_id"]

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check current entry status
        cursor.execute("SELECT entry_status FROM gmb_registrations WHERE id = ?", (reg_id,))
        curr = cursor.fetchone()
        if not curr:
            conn.close()
            raise ValueError("Registration record not found")

        if curr["entry_status"] == "ENTERED":
            # Duplicate entry attempt
            cursor.execute("""
            INSERT INTO gmb_scan_logs (id, pass_id, registration_id, action, result, staff_id, staff_name, scanner_type, counter_gate, reason, created_at)
            VALUES (?, ?, ?, 'ENTRY_ALREADY_COMPLETED', 'WARNING', ?, ?, 'GATE', ?, 'Attendee already checked in previously', ?)
            """, (f"scan_{uuid.uuid4().hex[:12]}", pass_id, reg_id, staff_id, staff_name, gate_name, now))
            conn.commit()
            conn.close()

            return {
                "success": False,
                "already_entered": True,
                "entry_status": "ENTERED",
                "scanned_at": now,
                "staff_name": staff_name,
                "gate_name": gate_name,
                "message": f"Attendee '{data['name']}' has ALREADY ENTERED."
            }

        # Perform atomic update
        cursor.execute("""
        UPDATE gmb_registrations
        SET entry_status = 'ENTERED'
        WHERE id = ? AND entry_status = 'NOT_ENTERED'
        """, (reg_id,))

        if cursor.rowcount == 0:
            conn.close()
            return {
                "success": False,
                "already_entered": True,
                "entry_status": "ENTERED",
                "scanned_at": now,
                "staff_name": staff_name,
                "gate_name": gate_name,
                "message": "Concurrent entry check caught. Attendee already marked entered."
            }

        # Record entry scan & scan log
        entry_id = f"ent_{uuid.uuid4().hex[:12]}"
        cursor.execute("""
        INSERT INTO gmb_entry_scans (id, pass_id, registration_id, staff_id, staff_name, gate_name, entry_status, scanned_at)
        VALUES (?, ?, ?, ?, ?, ?, 'SUCCESS', ?)
        """, (entry_id, pass_id, reg_id, staff_id, staff_name, gate_name, now))

        cursor.execute("""
        INSERT INTO gmb_scan_logs (id, pass_id, registration_id, action, result, staff_id, staff_name, scanner_type, counter_gate, reason, created_at)
        VALUES (?, ?, ?, 'ENTRY_CONFIRMED', 'SUCCESS', ?, ?, 'GATE', ?, 'Gate entry successfully verified', ?)
        """, (f"scan_{uuid.uuid4().hex[:12]}", pass_id, reg_id, staff_id, staff_name, gate_name, now))

        conn.commit()
        conn.close()

        return {
            "success": True,
            "already_entered": False,
            "entry_status": "ENTERED",
            "scanned_at": now,
            "staff_name": staff_name,
            "gate_name": gate_name,
            "message": f"Gate entry confirmed for '{data['name']}' ({data['employee_id']}) at {gate_name}!"
        }

    @staticmethod
    def claim_gift(qr_token: str, staff_id: str, staff_name: str, counter_name: str, gift_type_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Claims gift for attendee.
        Enforces strict business rules:
        1. Customer must have already entered gate (entry_status == 'ENTERED').
        2. One person = One gift (atomic update with row check).
        3. Assigns correct male/female gift item.
        """
        data = GmbService.get_pass_by_token(qr_token)
        now = datetime.now().isoformat() + "Z"

        if not data:
            raise ValueError("Event pass not found")

        reg_id = data["registration_id"]
        pass_id = data["pass_id"]
        gender = data.get("gender", "male").lower()

        conn = get_db_connection()
        cursor = conn.cursor()

        # Rule 1: Check entry status
        if data["entry_status"] != "ENTERED":
            cursor.execute("""
            INSERT INTO gmb_scan_logs (id, pass_id, registration_id, action, result, staff_id, staff_name, scanner_type, counter_gate, reason, created_at)
            VALUES (?, ?, ?, 'GIFT_LOCKED', 'REJECTED', ?, ?, 'GIFT', ?, 'Attendee has not checked in at Gate Entry yet', ?)
            """, (f"scan_{uuid.uuid4().hex[:12]}", pass_id, reg_id, staff_id, staff_name, counter_name, now))
            conn.commit()
            conn.close()

            return {
                "success": False,
                "entry_required": True,
                "already_claimed": False,
                "gift_status": "PENDING",
                "redeemed_at": now,
                "gift_name": "",
                "staff_name": staff_name,
                "counter_name": counter_name,
                "message": "GIFT LOCKED: Attendee has not checked in at the event gate yet."
            }

        # Rule 2: Check if already claimed
        if data["gift_status"] == "CLAIMED":
            cursor.execute("""
            INSERT INTO gmb_scan_logs (id, pass_id, registration_id, action, result, staff_id, staff_name, scanner_type, counter_gate, reason, created_at)
            VALUES (?, ?, ?, 'GIFT_ALREADY_CLAIMED', 'WARNING', ?, ?, 'GIFT', ?, 'Gift has already been claimed for this pass', ?)
            """, (f"scan_{uuid.uuid4().hex[:12]}", pass_id, reg_id, staff_id, staff_name, counter_name, now))
            conn.commit()
            conn.close()

            return {
                "success": False,
                "entry_required": False,
                "already_claimed": True,
                "gift_status": "CLAIMED",
                "redeemed_at": now,
                "gift_name": "",
                "staff_name": staff_name,
                "counter_name": counter_name,
                "message": f"GIFT ALREADY CLAIMED: Attendee '{data['name']}' has already received their gift."
            }

        # Determine gift type & name
        gift_id = gift_type_id or ("gift_male" if gender == "male" else "gift_female")
        cursor.execute("SELECT name FROM gmb_gift_types WHERE id = ?", (gift_id,))
        g_row = cursor.fetchone()
        gift_name = g_row["name"] if g_row else ("Executive Prestige Gift Set" if gender == "male" else "Pure Silk Saree & Jewelry Box")

        # Rule 3: Atomic update ensuring race condition safety
        cursor.execute("""
        UPDATE gmb_registrations
        SET gift_status = 'CLAIMED'
        WHERE id = ? AND gift_status = 'PENDING' AND entry_status = 'ENTERED'
        """, (reg_id,))

        if cursor.rowcount == 0:
            conn.close()
            return {
                "success": False,
                "entry_required": False,
                "already_claimed": True,
                "gift_status": "CLAIMED",
                "redeemed_at": now,
                "gift_name": gift_name,
                "staff_name": staff_name,
                "counter_name": counter_name,
                "message": "Concurrent gift claim rejected. Gift already claimed on another counter."
            }

        # Insert redemption & audit log
        redemption_id = f"red_{uuid.uuid4().hex[:12]}"
        cursor.execute("""
        INSERT INTO gmb_gift_redemptions (id, pass_id, registration_id, gift_type_id, gift_name, staff_id, staff_name, counter_name, status, redeemed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CLAIMED', ?)
        """, (redemption_id, pass_id, reg_id, gift_id, gift_name, staff_id, staff_name, counter_name, now))

        cursor.execute("""
        INSERT INTO gmb_scan_logs (id, pass_id, registration_id, action, result, staff_id, staff_name, scanner_type, counter_gate, reason, created_at)
        VALUES (?, ?, ?, 'GIFT_CLAIMED', 'SUCCESS', ?, ?, 'GIFT', ?, 'Gift successfully redeemed', ?)
        """, (f"scan_{uuid.uuid4().hex[:12]}", pass_id, reg_id, staff_id, staff_name, counter_name, now))

        conn.commit()
        conn.close()

        return {
            "success": True,
            "entry_required": False,
            "already_claimed": False,
            "gift_status": "CLAIMED",
            "redeemed_at": now,
            "gift_name": gift_name,
            "staff_name": staff_name,
            "counter_name": counter_name,
            "message": f"Successfully issued '{gift_name}' to '{data['name']}' ({data['gender'].capitalize()})!"
        }

    @staticmethod
    def get_dashboard_metrics() -> Dict[str, Any]:
        """Calculates fast aggregate statistics for the GMB Admin Dashboard"""
        conn = get_db_connection()
        cursor = conn.cursor()

        # Total registrations & status breakdowns
        cursor.execute("""
        SELECT
            COUNT(*) as total_reg,
            SUM(CASE WHEN entry_status = 'ENTERED' THEN 1 ELSE 0 END) as total_entered,
            SUM(CASE WHEN entry_status != 'ENTERED' THEN 1 ELSE 0 END) as not_entered,
            SUM(CASE WHEN gift_status = 'CLAIMED' THEN 1 ELSE 0 END) as gifts_claimed,
            SUM(CASE WHEN gift_status != 'CLAIMED' THEN 1 ELSE 0 END) as gifts_pending,
            SUM(CASE WHEN gender = 'male' THEN 1 ELSE 0 END) as male_count,
            SUM(CASE WHEN gender = 'female' THEN 1 ELSE 0 END) as female_count
        FROM gmb_registrations
        """)
        reg_stats = cursor.fetchone()

        # OTP verified count
        cursor.execute("SELECT COUNT(*) as cnt FROM gmb_otp_challenges WHERE is_verified = 1")
        otp_cnt = cursor.fetchone()["cnt"]

        # Passes generated
        cursor.execute("SELECT COUNT(*) as cnt FROM gmb_event_passes")
        pass_cnt = cursor.fetchone()["cnt"]

        # WhatsApp sent & failed
        cursor.execute("SELECT COUNT(*) as cnt FROM gmb_whatsapp_logs WHERE status = 'SENT'")
        wa_sent = cursor.fetchone()["cnt"]
        cursor.execute("SELECT COUNT(*) as cnt FROM gmb_whatsapp_logs WHERE status = 'FAILED'")
        wa_failed = cursor.fetchone()["cnt"]

        # Email sent & failed
        cursor.execute("SELECT COUNT(*) as cnt FROM gmb_email_logs WHERE status = 'SENT'")
        em_sent = cursor.fetchone()["cnt"]
        cursor.execute("SELECT COUNT(*) as cnt FROM gmb_email_logs WHERE status = 'FAILED'")
        em_failed = cursor.fetchone()["cnt"]

        # Branch breakdown
        cursor.execute("""
        SELECT b.name as branch_name, COUNT(r.id) as count
        FROM gmb_branches b
        LEFT JOIN gmb_registrations r ON b.id = r.branch_id
        GROUP BY b.id, b.name
        """)
        branch_rows = cursor.fetchall()
        branch_breakdown = {row["branch_name"]: row["count"] for row in branch_rows}

        conn.close()

        return {
            "total_registrations": reg_stats["total_reg"] or 0,
            "otp_verified_count": otp_cnt or 0,
            "passes_generated": pass_cnt or 0,
            "whatsapp_sent": wa_sent or 0,
            "whatsapp_failed": wa_failed or 0,
            "emails_sent": em_sent or 0,
            "emails_failed": em_failed or 0,
            "total_entered": reg_stats["total_entered"] or 0,
            "not_entered": reg_stats["not_entered"] or 0,
            "male_count": reg_stats["male_count"] or 0,
            "female_count": reg_stats["female_count"] or 0,
            "gifts_claimed": reg_stats["gifts_claimed"] or 0,
            "gifts_pending": reg_stats["gifts_pending"] or 0,
            "branch_breakdown": branch_breakdown
        }

    @staticmethod
    def list_registrations(
        page: int = 1,
        page_size: int = 25,
        search: str = "",
        branch_id: str = "",
        gender: str = "",
        entry_status: str = "",
        gift_status: str = ""
    ) -> Dict[str, Any]:
        conn = get_db_connection()
        cursor = conn.cursor()

        query_conditions = ["1=1"]
        params = []

        if search:
            query_conditions.append("(r.name LIKE ? OR r.mobile LIKE ? OR r.employee_id LIKE ? OR r.designation LIKE ?)")
            term = f"%{search}%"
            params.extend([term, term, term, term])

        if branch_id:
            query_conditions.append("r.branch_id = ?")
            params.append(branch_id)

        if gender:
            query_conditions.append("r.gender = ?")
            params.append(gender.lower())

        if entry_status:
            query_conditions.append("r.entry_status = ?")
            params.append(entry_status)

        if gift_status:
            query_conditions.append("r.gift_status = ?")
            params.append(gift_status)

        where_clause = " AND ".join(query_conditions)

        # Count total matching rows
        cursor.execute(f"SELECT COUNT(*) as total FROM gmb_registrations r WHERE {where_clause}", params)
        total = cursor.fetchone()["total"]

        # Fetch paginated rows with passes and logs
        offset = (page - 1) * page_size
        fetch_query = f"""
        SELECT r.id, r.name, r.designation, r.mobile, r.email, r.employee_id, r.gender,
               r.aadhaar_masked, r.registration_status, r.entry_status, r.gift_status,
               r.photo_url, r.created_at, b.name as branch_name, c.name as company_name,
               p.qr_token
        FROM gmb_registrations r
        JOIN gmb_branches b ON r.branch_id = b.id
        JOIN gmb_companies c ON r.company_id = c.id
        LEFT JOIN gmb_event_passes p ON r.id = p.registration_id
        WHERE {where_clause}
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
        """
        cursor.execute(fetch_query, params + [page_size, offset])
        rows = cursor.fetchall()
        conn.close()

        items = []
        for r in rows:
            items.append({
                "id": r["id"],
                "name": r["name"],
                "designation": r["designation"],
                "mobile": r["mobile"],
                "email": r["email"] or "",
                "employee_id": r["employee_id"],
                "gender": r["gender"],
                "company_name": r["company_name"],
                "branch_name": r["branch_name"],
                "masked_aadhaar": r["aadhaar_masked"],
                "registration_status": r["registration_status"],
                "entry_status": r["entry_status"],
                "gift_status": r["gift_status"],
                "photo_url": r["photo_url"],
                "qr_token": r["qr_token"] or "",
                "created_at": r["created_at"]
            })

        total_pages = max(1, (total + page_size - 1) // page_size)

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }

    @staticmethod
    def override_registration_status(
        qr_token: Optional[str] = None,
        registration_id: Optional[str] = None,
        entry_status: Optional[str] = None,
        gift_status: Optional[str] = None,
        gift_type_id: Optional[str] = None,
        name: Optional[str] = None,
        designation: Optional[str] = None,
        employee_id: Optional[str] = None,
        gender: Optional[str] = None,
        branch_id: Optional[str] = None,
        staff_id: str = "staff_admin",
        staff_name: str = "Staff",
        remark: str = "Manual staff override"
    ) -> Dict[str, Any]:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Find registration and pass
        if qr_token:
            cursor.execute("""
            SELECT r.id, r.name, r.entry_status, r.gift_status, r.gender, r.designation, r.employee_id, r.branch_id, p.id as pass_id, p.qr_token
            FROM gmb_event_passes p
            JOIN gmb_registrations r ON p.registration_id = r.id
            WHERE p.qr_token = ?
            """, (qr_token,))
        elif registration_id:
            cursor.execute("""
            SELECT r.id, r.name, r.entry_status, r.gift_status, r.gender, r.designation, r.employee_id, r.branch_id, p.id as pass_id, p.qr_token
            FROM gmb_registrations r
            LEFT JOIN gmb_event_passes p ON r.id = p.registration_id
            WHERE r.id = ?
            """, (registration_id,))
        else:
            conn.close()
            raise ValueError("Either qr_token or registration_id must be provided")

        row = cursor.fetchone()
        if not row:
            conn.close()
            raise ValueError("Delegate registration / pass not found")

        reg_id = row["id"]
        pass_id = row["pass_id"] or ""
        token = row["qr_token"] or qr_token or ""
        curr_name = row["name"]
        curr_gender = row["gender"]
        curr_entry = row["entry_status"]
        curr_gift = row["gift_status"]
        now = datetime.now().isoformat() + "Z"

        new_entry = entry_status if entry_status else curr_entry
        new_gift = gift_status if gift_status else curr_gift
        updated_name = name.strip() if name and name.strip() else curr_name
        updated_gender = gender.strip().lower() if gender and gender.strip() else curr_gender
        updated_desig = designation.strip() if designation and designation.strip() else row["designation"]
        updated_emp_id = employee_id.strip().upper() if employee_id and employee_id.strip() else row["employee_id"]
        updated_branch = branch_id.strip() if branch_id and branch_id.strip() else row["branch_id"]

        # 1. Update registration entry_status, gift_status and delegate details
        cursor.execute("""
        UPDATE gmb_registrations
        SET entry_status = ?, gift_status = ?, name = ?, gender = ?, designation = ?, employee_id = ?, branch_id = ?
        WHERE id = ?
        """, (new_entry, new_gift, updated_name, updated_gender, updated_desig, updated_emp_id, updated_branch, reg_id))

        # 2. If changing to ENTERED and not in gmb_entry_scans, insert record
        if new_entry == "ENTERED" and curr_entry != "ENTERED" and pass_id:
            scan_id = f"scan_{uuid.uuid4().hex[:12]}"
            cursor.execute("""
            INSERT INTO gmb_entry_scans (id, pass_id, registration_id, staff_id, staff_name, gate_name, entry_status, scanned_at)
            VALUES (?, ?, ?, ?, ?, 'Manual Override', 'ENTERED', ?)
            """, (scan_id, pass_id, reg_id, staff_id, staff_name, now))

        # 3. If changing to CLAIMED and not in gmb_gift_redemptions, insert record
        if new_gift == "CLAIMED" and curr_gift != "CLAIMED" and pass_id:
            gift_name = "Executive Prestige Gift Set" if str(updated_gender).lower() == "male" else "Pure Silk Saree & Jewelry Box"
            gid = gift_type_id or ("gift_male" if str(updated_gender).lower() == "male" else "gift_female")
            redemp_id = f"redemp_{uuid.uuid4().hex[:12]}"
            cursor.execute("""
            INSERT INTO gmb_gift_redemptions (id, pass_id, registration_id, gift_type_id, gift_name, staff_id, staff_name, counter_name, status, redeemed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Manual Override', 'CLAIMED', ?)
            """, (redemp_id, pass_id, reg_id, gid, gift_name, staff_id, staff_name, now))

        # 4. Write audit log in gmb_scan_logs
        log_id = f"log_{uuid.uuid4().hex[:12]}"
        log_reason = f"{remark} | Entry: {curr_entry} -> {new_entry} | Gift: {curr_gift} -> {new_gift}"
        cursor.execute("""
        INSERT INTO gmb_scan_logs (id, pass_id, registration_id, action, result, staff_id, staff_name, scanner_type, counter_gate, reason, created_at)
        VALUES (?, ?, ?, 'OVERRIDE', 'SUCCESS', ?, ?, 'ADMIN_OVERRIDE', 'Manual Edit', ?, ?)
        """, (log_id, pass_id, reg_id, staff_id, staff_name, log_reason, now))

        conn.commit()
        conn.close()

        return {
            "success": True,
            "message": f"Successfully updated status for {updated_name}: Entry={new_entry}, Gift={new_gift}",
            "registration_id": reg_id,
            "qr_token": token,
            "name": updated_name,
            "entry_status": new_entry,
            "gift_status": new_gift,
            "updated_at": now,
            "updated_by": staff_name or staff_id
        }
