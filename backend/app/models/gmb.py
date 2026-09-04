from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr, field_validator
import re

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"

class EntryStatus(str, Enum):
    NOT_ENTERED = "NOT_ENTERED"
    ENTERED = "ENTERED"

class GiftStatus(str, Enum):
    PENDING = "PENDING"
    CLAIMED = "CLAIMED"

class StaffRole(str, Enum):
    ADMIN = "ADMIN"
    GATE_STAFF = "GATE_STAFF"
    GIFT_STAFF = "GIFT_STAFF"

class ScanAction(str, Enum):
    QR_SCANNED = "QR_SCANNED"
    ENTRY_CONFIRMED = "ENTRY_CONFIRMED"
    ENTRY_ALREADY_COMPLETED = "ENTRY_ALREADY_COMPLETED"
    GIFT_CLAIMED = "GIFT_CLAIMED"
    GIFT_ALREADY_CLAIMED = "GIFT_ALREADY_CLAIMED"
    GIFT_LOCKED = "GIFT_LOCKED"
    INVALID_QR = "INVALID_QR"

class ScanResult(str, Enum):
    SUCCESS = "SUCCESS"
    WARNING = "WARNING"
    REJECTED = "REJECTED"
    ERROR = "ERROR"

class WhatsAppStatus(str, Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    READ = "READ"
    FAILED = "FAILED"

class EmailStatus(str, Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"

# ═══════════════════════════════════════════════════════════════════════════
# REQUEST / RESPONSE SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════

class GmbOtpSendRequest(BaseModel):
    mobile: str = Field(..., description="10-digit mobile number, with or without +91")
    employee_id: Optional[str] = Field(None, description="Compulsory Employee ID")

    @field_validator("mobile")
    @classmethod
    def validate_and_normalize_mobile(cls, v: str) -> str:
        clean = re.sub(r"[^\d]", "", v)
        if clean.startswith("91") and len(clean) == 12:
            clean = clean[2:]
        if len(clean) != 10:
            raise ValueError("Mobile number must be a valid 10-digit Indian phone number")
        return clean

    @field_validator("employee_id")
    @classmethod
    def validate_employee_id(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip().upper()
            if not v:
                return None
        return v

class GmbOtpSendResponse(BaseModel):
    success: bool
    session_token: str
    message: str
    expires_in: int
    demo_otp: Optional[str] = None

class GmbOtpVerifyRequest(BaseModel):
    mobile: str
    otp: str = Field(..., min_length=4, max_length=6)
    session_token: str

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        clean = re.sub(r"[^\d]", "", v)
        if clean.startswith("91") and len(clean) == 12:
            clean = clean[2:]
        if len(clean) != 10:
            raise ValueError("Invalid mobile format")
        return clean

class GmbOtpVerifyResponse(BaseModel):
    success: bool
    session_token: str
    verified: bool
    message: str

class GmbRegistrationCreate(BaseModel):
    company_id: str = Field(..., min_length=1)
    branch_id: str = Field(..., min_length=1)
    event_id: str = Field(default="evt_gbm2026")
    name: str = Field(..., min_length=2, max_length=100)
    designation: str = Field(..., min_length=2, max_length=100)
    mobile: str = Field(...)
    otp_session_token: Optional[str] = ""
    email: Optional[str] = None
    aadhaar_number: str = Field(..., description="Exactly 12 numeric digits")
    employee_id: str = Field(..., min_length=1, max_length=50)
    gender: Gender
    photo_url: str = Field(..., min_length=1)

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v

    @field_validator("designation")
    @classmethod
    def clean_designation(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Designation cannot be empty")
        return v

    @field_validator("mobile")
    @classmethod
    def clean_mobile(cls, v: str) -> str:
        clean = re.sub(r"[^\d]", "", v)
        if clean.startswith("91") and len(clean) == 12:
            clean = clean[2:]
        if len(clean) != 10:
            raise ValueError("Mobile must be exactly 10 digits")
        return clean

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return ""
        v = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("Invalid email format")
        return v

    @field_validator("aadhaar_number")
    @classmethod
    def validate_aadhaar(cls, v: str) -> str:
        clean = re.sub(r"[^\d]", "", v)
        if len(clean) != 12:
            raise ValueError("Aadhaar number must contain exactly 12 digits")
        return clean

    @field_validator("employee_id")
    @classmethod
    def clean_employee_id(cls, v: str) -> str:
        v = v.strip().upper()
        if not v:
            raise ValueError("Employee ID cannot be empty")
        return v

class GmbRegistrationResponse(BaseModel):
    success: bool
    registration_id: str
    pass_id: str
    qr_token: str
    download_url: str
    pass_url: str
    name: str
    branch_name: str
    message: str
    whatsapp_status: str
    email_status: str

class GmbStaffLoginRequest(BaseModel):
    username: str
    password: str

class GmbStaffLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: StaffRole
    full_name: str
    username: str
    branch_id: Optional[str] = ""

class GmbQrScanLookupRequest(BaseModel):
    qr_token: str

class GmbQrScanLookupResponse(BaseModel):
    pass_id: str
    registration_id: str
    name: str
    designation: str
    employee_id: str
    gender: str
    company_name: str
    branch_name: str
    photo_url: str
    entry_status: str
    gift_status: str
    masked_aadhaar: str
    suggested_gift_name: str
    suggested_gift_id: str
    entry_time: Optional[str] = None
    gift_claim_time: Optional[str] = None
    gift_counter: Optional[str] = None

class GmbEntryConfirmRequest(BaseModel):
    qr_token: str
    gate_name: str = "Main Gate"

class GmbEntryConfirmResponse(BaseModel):
    success: bool
    entry_status: str
    scanned_at: str
    staff_name: str
    gate_name: str
    message: str
    already_entered: bool = False

class GmbGiftClaimRequest(BaseModel):
    qr_token: str
    counter_name: str = "Gift Counter 1"
    gift_type_id: Optional[str] = None

class GmbGiftClaimResponse(BaseModel):
    success: bool
    gift_status: str
    redeemed_at: str
    gift_name: str
    staff_name: str
    counter_name: str
    message: str
    already_claimed: bool = False
    entry_required: bool = False

class GmbBranchItem(BaseModel):
    id: str
    company_id: str
    name: str
    code: str
    city: str

class GmbDashboardMetricsResponse(BaseModel):
    total_registrations: int
    otp_verified_count: int
    passes_generated: int
    whatsapp_sent: int
    whatsapp_failed: int
    emails_sent: int
    emails_failed: int
    total_entered: int
    not_entered: int
    male_count: int
    female_count: int
    gifts_claimed: int
    gifts_pending: int
    branch_breakdown: Dict[str, int]

class GmbRegistrationListItem(BaseModel):
    id: str
    name: str
    designation: str
    mobile: str
    email: str
    employee_id: str
    gender: str
    company_name: str
    branch_name: str
    masked_aadhaar: str
    registration_status: str
    entry_status: str
    gift_status: str
    photo_url: str
    qr_token: str
    created_at: str
    whatsapp_status: Optional[str] = None
    email_status: Optional[str] = None

class GmbRegistrationListResponse(BaseModel):
    items: List[GmbRegistrationListItem]
    total: int
    page: int
    page_size: int
    total_pages: int

class GmbStatusOverrideRequest(BaseModel):
    qr_token: Optional[str] = None
    registration_id: Optional[str] = None
    entry_status: Optional[EntryStatus] = None
    gift_status: Optional[GiftStatus] = None
    gift_type_id: Optional[str] = None
    name: Optional[str] = None
    designation: Optional[str] = None
    employee_id: Optional[str] = None
    gender: Optional[str] = None
    branch_id: Optional[str] = None
    remark: Optional[str] = "Manual staff override"
    username: Optional[str] = None
    password: Optional[str] = None

class GmbStatusOverrideResponse(BaseModel):
    success: bool
    message: str
    registration_id: str
    qr_token: str
    name: str
    entry_status: EntryStatus
    gift_status: GiftStatus
    updated_at: str
    updated_by: str

class GmbParticipantEditRequest(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    employee_id: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    gender: Optional[str] = None
    branch_id: Optional[str] = None
    entry_status: Optional[EntryStatus] = None
    gift_status: Optional[GiftStatus] = None
