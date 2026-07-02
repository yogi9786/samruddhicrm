from pydantic import BaseModel

class MetaSettings(BaseModel):
    page_id: str
    access_token: str
    verify_token: str
    is_active: bool

class SendDMRequest(BaseModel):
    recipient_id: str
    message_text: str
    platform: str
