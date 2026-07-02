from pydantic import BaseModel
from typing import Optional, List

class EmailSettings(BaseModel):
    api_key: str
    sender_email: str
    sender_name: str
    is_active: bool

class SendEmailRequest(BaseModel):
    to_email: str
    subject: str
    body: str
    attachment_name: Optional[str] = None
    attachment_content: Optional[str] = None

class SendBulkEmailRequest(BaseModel):
    to_emails: List[str]
    subject: str
    body: str
    attachment_name: Optional[str] = None
    attachment_content: Optional[str] = None
