import os
import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv

from app.core.database import get_db_connection, hash_password
from app.models.gmb import (
    StaffRole,
    GmbStaffLoginRequest, GmbStaffLoginResponse,
    GmbQrScanLookupRequest, GmbQrScanLookupResponse,
    GmbEntryConfirmRequest, GmbEntryConfirmResponse,
    GmbGiftClaimRequest, GmbGiftClaimResponse,
    GmbDashboardMetricsResponse,
    GmbRegistrationListResponse,
    GmbStatusOverrideRequest, GmbStatusOverrideResponse,
    GmbParticipantEditRequest
)
from app.services.gmb_service import GmbService
from app.services.gmb_pdf import GmbPdfService
from app.services.gmb_comms import AiSensyService, BrevoEmailService

load_dotenv()

router = APIRouter()
security = HTTPBearer(auto_error=False)

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-ssgp")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "siriadmin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "siriadmin1234")
STAFF_USERNAME = os.getenv("STAFF_USERNAME", "staff")
STAFF_PASSWORD = os.getenv("STAFF_PASSWORD", "staff1234")

def create_staff_jwt(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_staff(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication credentials required")
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        staff_id: str = payload.get("staff_id", "")
        full_name: str = payload.get("full_name", username)
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"username": username, "role": role, "staff_id": staff_id, "full_name": full_name}
    except JWTError:
        raise HTTPException(status_code=401, detail="Authentication token invalid or expired")

def require_role(allowed_roles: List[str]):
    def role_checker(staff: Dict[str, Any] = Depends(get_current_staff)):
        if staff["role"] not in allowed_roles and staff["role"] != "ADMIN":
            raise HTTPException(status_code=403, detail="Access denied. Insufficient permissions for this action.")
        return staff
    return role_checker

# ═══════════════════════════════════════════════════════════════════════════
# AUTHENTICATION
# ═══════════════════════════════════════════════════════════════════════════

@router.post("/login", response_model=GmbStaffLoginResponse)
def staff_login(req: GmbStaffLoginRequest):
    u = req.username.strip()
    p = req.password.strip()

    # 1. Check Primary Admin credentials from .env
    if u.lower() == ADMIN_USERNAME.lower() and p == ADMIN_PASSWORD:
        token = create_staff_jwt({
            "sub": ADMIN_USERNAME,
            "role": "ADMIN",
            "staff_id": "staff_admin",
            "full_name": "Chief Administrator"
        })
        return GmbStaffLoginResponse(
            access_token=token,
            token_type="bearer",
            role=StaffRole.ADMIN,
            full_name="Chief Administrator",
            username=ADMIN_USERNAME,
            branch_id=""
        )

    # 2. Check Staff credentials from .env
    if u.lower() == STAFF_USERNAME.lower() and p == STAFF_PASSWORD:
        token = create_staff_jwt({
            "sub": STAFF_USERNAME,
            "role": "ADMIN",
            "staff_id": "staff_env_user",
            "full_name": "Authorized Event Staff"
        })
        return GmbStaffLoginResponse(
            access_token=token,
            token_type="bearer",
            role=StaffRole.ADMIN,
            full_name="Authorized Event Staff",
            username=STAFF_USERNAME,
            branch_id=""
        )

    # 3. Check Database Staff Table (Case-insensitive)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, username, password_hash, full_name, role, branch_id, is_active
    FROM gmb_staff_users
    WHERE LOWER(username) = LOWER(?) AND is_active = 1
    """, (u,))
    staff = cursor.fetchone()
    conn.close()

    if not staff or hash_password(p) != staff["password_hash"]:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    user_role = staff["role"]
    if user_role not in [r.value for r in StaffRole]:
        user_role = "ADMIN"

    token = create_staff_jwt({
        "sub": staff["username"],
        "role": user_role,
        "staff_id": staff["id"],
        "full_name": staff["full_name"],
        "branch_id": staff["branch_id"] or ""
    })

    return GmbStaffLoginResponse(
        access_token=token,
        token_type="bearer",
        role=StaffRole(user_role),
        full_name=staff["full_name"],
        username=staff["username"],
        branch_id=staff["branch_id"] or ""
    )

# ═══════════════════════════════════════════════════════════════════════════
# DASHBOARD & METRICS
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/dashboard", response_model=GmbDashboardMetricsResponse)
def get_dashboard(staff: Dict[str, Any] = Depends(get_current_staff)):
    return GmbService.get_dashboard_metrics()

# ═══════════════════════════════════════════════════════════════════════════
# REGISTRATIONS
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/registrations", response_model=GmbRegistrationListResponse)
def list_registrations(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
    search: str = "",
    branch_id: str = "",
    gender: str = "",
    entry_status: str = "",
    gift_status: str = "",
    staff: Dict[str, Any] = Depends(get_current_staff)
):
    return GmbService.list_registrations(
        page=page,
        page_size=page_size,
        search=search,
        branch_id=branch_id,
        gender=gender,
        entry_status=entry_status,
        gift_status=gift_status
    )

@router.get("/registrations/{reg_id}")
def get_registration_details(reg_id: str, staff: Dict[str, Any] = Depends(get_current_staff)):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT r.*, b.name as branch_name, c.name as company_name, p.qr_token, p.download_token
    FROM gmb_registrations r
    JOIN gmb_branches b ON r.branch_id = b.id
    JOIN gmb_companies c ON r.company_id = c.id
    LEFT JOIN gmb_event_passes p ON r.id = p.registration_id
    WHERE r.id = ?
    """, (reg_id,))
    reg = cursor.fetchone()

    if not reg:
        conn.close()
        raise HTTPException(status_code=404, detail="Registration not found")

    # Scans and Entries
    cursor.execute("SELECT * FROM gmb_entry_scans WHERE registration_id = ? ORDER BY scanned_at DESC", (reg_id,))
    entry_scans = [dict(r) for r in cursor.fetchall()]

    # Gift Redemptions
    cursor.execute("SELECT * FROM gmb_gift_redemptions WHERE registration_id = ? ORDER BY redeemed_at DESC", (reg_id,))
    gift_redemptions = [dict(r) for r in cursor.fetchall()]

    # Scan Logs
    cursor.execute("SELECT * FROM gmb_scan_logs WHERE registration_id = ? ORDER BY created_at DESC", (reg_id,))
    scan_logs = [dict(r) for r in cursor.fetchall()]

    # WhatsApp Logs
    cursor.execute("SELECT * FROM gmb_whatsapp_logs WHERE registration_id = ? ORDER BY created_at DESC", (reg_id,))
    wa_logs = [dict(r) for r in cursor.fetchall()]

    # Email Logs
    cursor.execute("SELECT * FROM gmb_email_logs WHERE registration_id = ? ORDER BY created_at DESC", (reg_id,))
    em_logs = [dict(r) for r in cursor.fetchall()]

    conn.close()

    res = dict(reg)
    res["entry_scans"] = entry_scans
    res["gift_redemptions"] = gift_redemptions
    res["scan_logs"] = scan_logs
    res["whatsapp_logs"] = wa_logs
    res["email_logs"] = em_logs
    return res

@router.put("/registrations/{reg_id}")
def update_registration_participant(
    reg_id: str,
    req: GmbParticipantEditRequest,
    staff: Dict[str, Any] = Depends(require_role(["ADMIN"]))
):
    """
    Admin updates participant details (name, employee_id, mobile, email, branch, designation, gender, entry_status, gift_status).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM gmb_registrations WHERE id = ?", (reg_id,))
    reg = cursor.fetchone()
    if not reg:
        conn.close()
        raise HTTPException(status_code=404, detail="Participant registration not found.")

    # Check for duplicate mobile or employee_id if changing
    if req.mobile and req.mobile.strip() != reg["mobile"]:
        cursor.execute("SELECT id FROM gmb_registrations WHERE mobile = ? AND id != ?", (req.mobile.strip(), reg_id))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Another participant with this mobile number already exists.")

    if req.employee_id and req.employee_id.strip().upper() != reg["employee_id"]:
        cursor.execute("SELECT id FROM gmb_registrations WHERE employee_id = ? AND id != ?", (req.employee_id.strip().upper(), reg_id))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail=f"Another participant with Employee ID '{req.employee_id}' already exists.")

    try:
        updated_name = req.name.strip() if req.name and req.name.strip() else reg["name"]
        updated_desig = req.designation.strip() if req.designation and req.designation.strip() else reg["designation"]
        updated_emp_id = req.employee_id.strip().upper() if req.employee_id and req.employee_id.strip() else reg["employee_id"]
        updated_mobile = req.mobile.strip() if req.mobile and req.mobile.strip() else reg["mobile"]
        updated_email = req.email.strip() if req.email is not None else reg["email"]
        updated_gender = req.gender.strip().lower() if req.gender and req.gender.strip() else reg["gender"]
        updated_branch = req.branch_id.strip() if req.branch_id and req.branch_id.strip() else reg["branch_id"]
        
        updated_entry = req.entry_status.value if hasattr(req.entry_status, 'value') else (req.entry_status or reg["entry_status"])
        updated_gift = req.gift_status.value if hasattr(req.gift_status, 'value') else (req.gift_status or reg["gift_status"])

        cursor.execute("""
        UPDATE gmb_registrations
        SET name = ?, designation = ?, employee_id = ?, mobile = ?, email = ?,
            gender = ?, branch_id = ?, entry_status = ?, gift_status = ?
        WHERE id = ?
        """, (
            updated_name, updated_desig, updated_emp_id, updated_mobile, updated_email,
            updated_gender, updated_branch, updated_entry, updated_gift, reg_id
        ))

        # Audit log
        now = datetime.now().isoformat() + "Z"
        log_id = f"log_{uuid.uuid4().hex[:12]}"
        cursor.execute("""
        INSERT INTO gmb_scan_logs (id, pass_id, registration_id, action, result, staff_id, staff_name, scanner_type, reason, created_at)
        VALUES (?, '', ?, 'ADMIN_EDIT', 'SUCCESS', ?, ?, 'ADMIN', 'Admin edited participant details', ?)
        """, (log_id, reg_id, staff.get("staff_id", "staff_admin"), staff.get("full_name", "Admin"), now))

        # Query pass data for PDF regeneration on the SAME connection before closing
        cursor.execute("""
        SELECT p.qr_token, b.name as branch_name, c.name as company_name, r.photo_url, r.aadhaar_masked
        FROM gmb_event_passes p
        JOIN gmb_registrations r ON p.registration_id = r.id
        LEFT JOIN gmb_branches b ON r.branch_id = b.id
        LEFT JOIN gmb_companies c ON r.company_id = c.id
        WHERE r.id = ?
        """, (reg_id,))
        pass_row = cursor.fetchone()

        conn.commit()
        conn.close()

        # Re-generate PDF if pass exists
        if pass_row and pass_row["qr_token"]:
            try:
                public_base_url = os.getenv("GMB_PUBLIC_BASE_URL", "http://localhost:5173")
                GmbPdfService.generate_event_pass_pdf(
                    qr_token=pass_row["qr_token"],
                    name=updated_name,
                    designation=updated_desig,
                    employee_id=updated_emp_id,
                    branch_name=pass_row["branch_name"] or "Yelahanka",
                    company_name=pass_row["company_name"] or "Siri Samruddhi Gold Palace",
                    masked_aadhaar=pass_row["aadhaar_masked"] or "",
                    gender=updated_gender,
                    photo_filename=pass_row["photo_url"] or "",
                    public_base_url=public_base_url
                )
            except Exception as pdf_err:
                print(f"Error refreshing PDF pass after edit: {pdf_err}")

        return {
            "success": True,
            "message": f"Participant '{updated_name}' updated successfully.",
            "id": reg_id
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/registrations/{reg_id}")
def delete_registration_participant(
    reg_id: str,
    staff: Dict[str, Any] = Depends(require_role(["ADMIN"]))
):
    """
    Admin permanently deletes a participant registration and its associated passes/logs.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, employee_id FROM gmb_registrations WHERE id = ?", (reg_id,))
    reg = cursor.fetchone()
    if not reg:
        conn.close()
        raise HTTPException(status_code=404, detail="Participant registration not found.")

    name = reg["name"]
    emp_id = reg["employee_id"]

    # Delete related records
    cursor.execute("DELETE FROM gmb_entry_scans WHERE registration_id = ?", (reg_id,))
    cursor.execute("DELETE FROM gmb_gift_redemptions WHERE registration_id = ?", (reg_id,))
    cursor.execute("DELETE FROM gmb_scan_logs WHERE registration_id = ?", (reg_id,))
    cursor.execute("DELETE FROM gmb_whatsapp_logs WHERE registration_id = ?", (reg_id,))
    cursor.execute("DELETE FROM gmb_email_logs WHERE registration_id = ?", (reg_id,))
    cursor.execute("DELETE FROM gmb_event_passes WHERE registration_id = ?", (reg_id,))
    cursor.execute("DELETE FROM gmb_registrations WHERE id = ?", (reg_id,))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": f"Participant '{name}' ({emp_id}) deleted successfully."
    }

# ═══════════════════════════════════════════════════════════════════════════
# SCANNER APIS (Gate Entry & Gift Redemption)
# ═══════════════════════════════════════════════════════════════════════════

@router.post("/scan/lookup", response_model=GmbQrScanLookupResponse)
def lookup_qr(req: GmbQrScanLookupRequest, staff: Dict[str, Any] = Depends(get_current_staff)):
    """
    Staff scans attendee QR token.
    Returns details and validates permissions.
    """
    try:
        scanner_type = "GIFT" if staff["role"] == "GIFT_STAFF" else "GATE"
        return GmbService.lookup_qr_for_staff(req.qr_token, staff["staff_id"], scanner_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/scan/entry/confirm", response_model=GmbEntryConfirmResponse)
def confirm_gate_entry(
    req: GmbEntryConfirmRequest,
    staff: Dict[str, Any] = Depends(require_role(["ADMIN", "GATE_STAFF"]))
):
    """
    Gate Staff or Admin confirms check-in.
    """
    try:
        res = GmbService.confirm_gate_entry(
            qr_token=req.qr_token,
            staff_id=staff["staff_id"],
            staff_name=staff["full_name"],
            gate_name=req.gate_name
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/scan/gift/claim", response_model=GmbGiftClaimResponse)
def claim_gift(
    req: GmbGiftClaimRequest,
    staff: Dict[str, Any] = Depends(require_role(["ADMIN", "GIFT_STAFF"]))
):
    """
    Gift Staff or Admin redeems gift for attendee.
    Enforces check-in requirement, gender matching, and one-gift-per-attendee rule.
    """
    try:
        res = GmbService.claim_gift(
            qr_token=req.qr_token,
            staff_id=staff["staff_id"],
            staff_name=staff["full_name"],
            counter_name=req.counter_name,
            gift_type_id=req.gift_type_id
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/override-status", response_model=GmbStatusOverrideResponse)
def override_status(
    req: GmbStatusOverrideRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """
    Overrides / Edits delegate entry_status and/or gift_status.
    Requires valid Staff JWT token OR valid Staff/Admin username & password in body.
    """
    staff_name = "Staff"
    staff_id = "staff_admin"

    # Check Direct Credentials if provided
    if req.username and req.password:
        if req.username == ADMIN_USERNAME and req.password == ADMIN_PASSWORD:
            staff_name = "Chief Administrator"
            staff_id = "staff_admin"
        elif req.username == STAFF_USERNAME and req.password == STAFF_PASSWORD:
            staff_name = "Authorized Event Staff"
            staff_id = "staff_env_user"
        else:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
            SELECT id, full_name, password_hash, is_active FROM gmb_staff_users
            WHERE username = ? AND is_active = 1
            """, (req.username,))
            db_staff = cursor.fetchone()
            conn.close()
            if not db_staff or hash_password(req.password) != db_staff["password_hash"]:
                raise HTTPException(status_code=401, detail="Invalid staff username or password")
            staff_name = db_staff["full_name"]
            staff_id = db_staff["id"]
    elif credentials:
        try:
            payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
            staff_name = payload.get("full_name") or payload.get("sub", "Staff")
            staff_id = payload.get("staff_id", "staff_admin")
        except JWTError:
            raise HTTPException(status_code=401, detail="Authentication token invalid or expired")
    else:
        raise HTTPException(status_code=401, detail="Staff username and password or authentication token is required")

    try:
        res = GmbService.override_registration_status(
            qr_token=req.qr_token,
            registration_id=req.registration_id,
            entry_status=req.entry_status.value if req.entry_status else None,
            gift_status=req.gift_status.value if req.gift_status else None,
            gift_type_id=req.gift_type_id,
            name=req.name,
            designation=req.designation,
            employee_id=req.employee_id,
            gender=req.gender,
            branch_id=req.branch_id,
            staff_id=staff_id,
            staff_name=staff_name,
            remark=req.remark or "Manual staff override"
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ═══════════════════════════════════════════════════════════════════════════
# AUDIT & HISTORY LOGS
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/history/entry")
def get_entry_history(staff: Dict[str, Any] = Depends(get_current_staff)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT e.*, r.name as attendee_name, r.employee_id, b.name as branch_name
    FROM gmb_entry_scans e
    JOIN gmb_registrations r ON e.registration_id = r.id
    JOIN gmb_branches b ON r.branch_id = b.id
    ORDER BY e.scanned_at DESC LIMIT 200
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/history/gift")
def get_gift_history(staff: Dict[str, Any] = Depends(get_current_staff)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT g.*, r.name as attendee_name, r.employee_id, r.gender, b.name as branch_name
    FROM gmb_gift_redemptions g
    JOIN gmb_registrations r ON g.registration_id = r.id
    JOIN gmb_branches b ON r.branch_id = b.id
    ORDER BY g.redeemed_at DESC LIMIT 200
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/logs/whatsapp")
def get_whatsapp_logs(staff: Dict[str, Any] = Depends(require_role(["ADMIN"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT w.*, r.name as attendee_name
    FROM gmb_whatsapp_logs w
    LEFT JOIN gmb_registrations r ON w.registration_id = r.id
    ORDER BY w.created_at DESC LIMIT 200
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/logs/email")
def get_email_logs(staff: Dict[str, Any] = Depends(require_role(["ADMIN"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT m.*, r.name as attendee_name
    FROM gmb_email_logs m
    LEFT JOIN gmb_registrations r ON m.registration_id = r.id
    ORDER BY m.created_at DESC LIMIT 200
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ═══════════════════════════════════════════════════════════════════════════
# RESEND COMMUNICATIONS (Admin Only)
# ═══════════════════════════════════════════════════════════════════════════

@router.post("/resend/whatsapp/{reg_id}")
async def resend_whatsapp(reg_id: str, staff: Dict[str, Any] = Depends(require_role(["ADMIN"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT r.name, r.mobile, p.qr_token
    FROM gmb_registrations r
    JOIN gmb_event_passes p ON r.id = p.registration_id
    WHERE r.id = ?
    """, (reg_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Registration not found")

    base_url = os.getenv("GMB_PUBLIC_BASE_URL", "http://localhost:5173")
    pass_url = f"{base_url.rstrip('/')}/gmb/pass/{row['qr_token']}"

    success, status_str = await AiSensyService.send_whatsapp_pass(
        registration_id=reg_id,
        mobile=row["mobile"],
        name=row["name"],
        download_url=pass_url
    )
    return {"success": success, "status": status_str, "message": "WhatsApp resend triggered"}

@router.post("/resend/email/{reg_id}")
async def resend_email(reg_id: str, staff: Dict[str, Any] = Depends(require_role(["ADMIN"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT r.name, r.email, p.pdf_path, p.download_token
    FROM gmb_registrations r
    JOIN gmb_event_passes p ON r.id = p.registration_id
    WHERE r.id = ?
    """, (reg_id,))
    row = cursor.fetchone()
    conn.close()

    if not row or not row["email"]:
        raise HTTPException(status_code=400, detail="Registration has no associated email address")

    base_url = os.getenv("GMB_PUBLIC_BASE_URL", "http://localhost:5173")
    download_url = f"{base_url.rstrip('/')}/api/gmb/pass/{row['download_token']}"

    success, status_str = await BrevoEmailService.send_email_pass(
        registration_id=reg_id,
        email=row["email"],
        name=row["name"],
        pdf_path=row["pdf_path"],
        download_url=download_url
    )
    return {"success": success, "status": status_str, "message": "Email resend triggered"}

# ═══════════════════════════════════════════════════════════════════════════
# STAFF USER MANAGEMENT (Admin Only)
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/staff")
def list_staff(staff: Dict[str, Any] = Depends(require_role(["ADMIN"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT s.id, s.username, s.full_name, s.role, s.branch_id, s.is_active, s.created_at, b.name as branch_name
    FROM gmb_staff_users s
    LEFT JOIN gmb_branches b ON s.branch_id = b.id
    ORDER BY s.created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/staff")
def create_staff(payload: Dict[str, Any], staff: Dict[str, Any] = Depends(require_role(["ADMIN"]))):
    username = payload.get("username", "").strip()
    password = payload.get("password", "").strip()
    full_name = payload.get("full_name", "").strip()
    role = payload.get("role", "GATE_STAFF")
    branch_id = payload.get("branch_id", "")

    if not username or not password or not full_name:
        raise HTTPException(status_code=400, detail="Username, password, and full name are required")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM gmb_staff_users WHERE username = ?", (username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username already exists")

    staff_id = f"staff_{uuid.uuid4().hex[:10]}"
    now = datetime.now().isoformat() + "Z"
    cursor.execute("""
    INSERT INTO gmb_staff_users (id, username, password_hash, full_name, role, branch_id, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    """, (staff_id, username, hash_password(password), full_name, role, branch_id, now))
    conn.commit()
    conn.close()

    return {"success": True, "staff_id": staff_id, "message": f"Staff account for '{full_name}' created successfully."}

@router.delete("/staff/{staff_id}")
def delete_staff(staff_id: str, staff: Dict[str, Any] = Depends(require_role(["ADMIN"]))):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM gmb_staff_users WHERE id = ?", (staff_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Staff deleted successfully"}
