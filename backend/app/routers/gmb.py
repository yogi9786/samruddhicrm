import os
import uuid
import shutil
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form, Depends, status
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from PIL import Image
from dotenv import load_dotenv

from app.models.gmb import (
    GmbOtpSendRequest, GmbOtpSendResponse,
    GmbOtpVerifyRequest, GmbOtpVerifyResponse,
    GmbRegistrationCreate, GmbRegistrationResponse,
    GmbStatusOverrideRequest, GmbStatusOverrideResponse
)
from app.core.database import get_db_connection, hash_password
from app.services.gmb_otp import GmbOtpService
from app.services.gmb_service import GmbService
from app.services.gmb_pdf import PHOTOS_DIR, PASSES_DIR, GmbPdfService

load_dotenv()

router = APIRouter()
security = HTTPBearer(auto_error=False)

SECRET_KEY = os.getenv("SECRET_KEY", "b1d4e5f7a0c9865c345a987d65f5a87b1c3a6b8c4d2e1f0")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
GMB_PUBLIC_BASE_URL = os.getenv("GMB_PUBLIC_BASE_URL", "http://localhost:5173")

@router.get("/branches")
def get_branches():
    """Retrieve all active branches for registration"""
    return GmbService.get_branches()

@router.get("/companies")
def get_companies():
    """Retrieve all active companies"""
    return GmbService.get_companies()

@router.post("/otp/send", response_model=GmbOtpSendResponse)
async def send_otp(req: GmbOtpSendRequest):
    """Sends SMS OTP via Digintra (with dev fallback)"""
    success, token, msg, demo = await GmbOtpService.send_otp(req.mobile)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return GmbOtpSendResponse(
        success=True,
        session_token=token,
        message=msg,
        expires_in=300,
        demo_otp=demo
    )

@router.post("/otp/verify", response_model=GmbOtpVerifyResponse)
def verify_otp(req: GmbOtpVerifyRequest):
    """Verifies OTP entered by attendee"""
    is_valid, msg = GmbOtpService.verify_otp(req.mobile, req.otp, req.session_token)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)
    return GmbOtpVerifyResponse(
        success=True,
        session_token=req.session_token,
        verified=True,
        message=msg
    )

@router.post("/upload-photo")
async def upload_photo(file: UploadFile = File(...)):
    """
    Accepts live selfie or uploaded photo from browser/camera.
    Validates MIME type, compresses image, and stores securely.
    """
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid image type. Only JPEG, PNG, and WebP are supported.")

    ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else "jpg"
    if ext not in ["jpg", "jpeg", "png", "webp"]:
        ext = "jpg"

    unique_filename = f"photo_{uuid.uuid4().hex[:16]}.{ext}"
    dest_path = PHOTOS_DIR / unique_filename

    try:
        # Read file contents
        content = await file.read()
        if len(content) > 10 * 1024 * 1024: # 10MB limit
            raise HTTPException(status_code=400, detail="Image size exceeds maximum limit of 10MB.")

        # Open with PIL, convert/orient and compress
        with Image.open(dest_path.open("wb") if False else io.BytesIO(content)) as img:
            # Convert RGBA to RGB if needed for JPEG
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            # Resize if dimensions are huge
            img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
            img.save(str(dest_path), format="JPEG", quality=85, optimize=True)

        return {
            "success": True,
            "filename": unique_filename,
            "photo_url": unique_filename,
            "message": "Photo uploaded successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing uploaded image: {e}")
        raise HTTPException(status_code=500, detail="Failed to process image upload.")

import io

@router.post("/register", response_model=GmbRegistrationResponse)
async def register(req: GmbRegistrationCreate, request: Request):
    """
    Processes attendee registration, generates unique QR and PDF pass,
    and queues WhatsApp / Email notifications.
    """
    # Use configured public host (ssgpcrm.cloud)
    base_url = (os.getenv("GBM_PUBLIC_BASE_URL") or os.getenv("GMB_PUBLIC_BASE_URL") or "https://ssgpcrm.cloud").rstrip('/')
    try:
        res = await GmbService.register_attendee(req, base_url)
        return res
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as err:
        print(f"Registration error: {err}")
        raise HTTPException(status_code=500, detail="An internal server error occurred during registration.")

@router.get("/pass/{token}")
def download_pass_pdf(token: str):
    """
    Streams the personalized event pass PDF for direct download.
    Regenerates on the fly if not yet cached on disk.
    """
    data = GmbService.get_pass_by_token(token)
    if not data:
        raise HTTPException(status_code=404, detail="Event pass not found.")

    pdf_file = Path(data["pdf_path"]) if data.get("pdf_path") else PASSES_DIR / f"pass_{data['qr_token']}.pdf"
    if not pdf_file.exists():
        try:
            pdf_path_str = GmbPdfService.generate_event_pass_pdf(
                qr_token=data["qr_token"],
                name=data["name"],
                designation=data["designation"],
                employee_id=data["employee_id"],
                branch_name=data["branch_name"],
                company_name=data["company_name"],
                gender=data.get("gender", "male"),
                photo_filename=data.get("photo_url", ""),
                public_base_url=GMB_PUBLIC_BASE_URL
            )
            pdf_file = Path(pdf_path_str)
        except Exception as gen_err:
            print(f"Error generating pass PDF on-the-fly: {gen_err}")
            raise HTTPException(status_code=500, detail="Failed to generate pass PDF.")

    emp_id = data.get('employee_id', 'Delegate').replace('/', '_').replace('\\', '_')
    filename = f"GBM_Pass_{emp_id}.pdf"

    return FileResponse(
        path=str(pdf_file),
        filename=filename,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.get("/pass-data/{token}")
def get_pass_data(token: str):
    """
    Returns public pass details for mobile view on /gmb/pass/:token
    """
    data = GmbService.get_pass_by_token(token)
    if not data:
        raise HTTPException(status_code=404, detail="Invalid event pass token.")

    return {
        "pass_id": data["pass_id"],
        "qr_token": data["qr_token"],
        "name": data["name"],
        "designation": data["designation"],
        "employee_id": data["employee_id"],
        "branch_name": data["branch_name"],
        "company_name": data["company_name"],
        "gender": data["gender"],
        "photo_url": data["photo_url"],
        "entry_status": data["entry_status"],
        "gift_status": data["gift_status"],
        "masked_aadhaar": data["aadhaar_masked"],
        "download_url": f"{GMB_PUBLIC_BASE_URL.rstrip('/')}/api/gmb/pass/{data['download_token']}"
    }

@router.get("/photos/{filename}")
def get_attendee_photo(filename: str):
    """Serves attendee uploaded photo"""
    clean_name = os.path.basename(filename)
    path = PHOTOS_DIR / clean_name
    if not path.exists():
        raise HTTPException(status_code=404, detail="Photo not found.")
    return FileResponse(str(path))

@router.post("/pass/{token}/edit-status", response_model=GmbStatusOverrideResponse)
def edit_pass_status(
    token: str, 
    req: GmbStatusOverrideRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """
    Allows staff/admin to directly edit entry or gift status from the pass view
    after verifying JWT bearer token OR staff username and password.
    """
    ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "siriadmin")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "siriadmin1234")
    STAFF_USERNAME = os.getenv("STAFF_USERNAME", "staff")
    STAFF_PASSWORD = os.getenv("STAFF_PASSWORD", "staff1234")

    staff_name = "Staff"
    staff_id = "staff_user"
    authenticated = False

    # 1. Check Bearer JWT token from Authorization header if present
    if credentials and credentials.credentials:
        try:
            payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub", "")
            if username:
                staff_name = payload.get("full_name", username)
                staff_id = payload.get("staff_id", username)
                authenticated = True
        except JWTError:
            pass

    # 2. Check username & password in request body if not already authenticated via Bearer
    if not authenticated and req.username and req.password:
        if req.username == ADMIN_USERNAME and req.password == ADMIN_PASSWORD:
            staff_name = "Chief Administrator"
            staff_id = "staff_admin"
            authenticated = True
        elif req.username == STAFF_USERNAME and req.password == STAFF_PASSWORD:
            staff_name = "Authorized Event Staff"
            staff_id = "staff_env_user"
            authenticated = True
        else:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
            SELECT id, full_name, password_hash, is_active FROM gmb_staff_users
            WHERE username = ? AND is_active = 1
            """, (req.username,))
            db_staff = cursor.fetchone()
            conn.close()
            if db_staff and hash_password(req.password) == db_staff["password_hash"]:
                staff_name = db_staff["full_name"]
                staff_id = db_staff["id"]
                authenticated = True

    if not authenticated:
        raise HTTPException(
            status_code=401, 
            detail="Staff credentials or active staff session required to edit status. Please verify staff permissions."
        )

    try:
        res = GmbService.override_registration_status(
            qr_token=token,
            registration_id=None,
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
            remark=req.remark or "Pass View Edit"
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

