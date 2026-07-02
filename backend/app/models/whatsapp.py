from pydantic import BaseModel
from typing import List

class WhatsAppSettings(BaseModel):
    account_sid: str
    auth_token: str
    phone_number: str
    is_active: bool

class SendMessageRequest(BaseModel):
    to_number: str
    body: str

class SendBulkRequest(BaseModel):
    to_numbers: List[str]
    body: str

class TemplateRequest(BaseModel):
    name: str
    body: str
    category: str
