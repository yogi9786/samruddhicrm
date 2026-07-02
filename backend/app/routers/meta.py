from fastapi import APIRouter, Depends, HTTPException
from app.dependencies.deps import (
    get_current_user, 
    get_meta_settings_dep, 
    get_meta_leads_dep, 
    get_meta_dms_dep
)
from app.models.meta import MetaSettings, SendDMRequest
from app.core.firebase import db
from datetime import datetime
import uuid

router = APIRouter()

@router.get("/settings")
async def get_meta_settings(
    settings = Depends(get_meta_settings_dep), 
    current_user: str = Depends(get_current_user)
):
    return settings

@router.post("/settings")
async def update_meta_settings(
    settings: MetaSettings, 
    current_user: str = Depends(get_current_user)
):
    db.collection("settings").document("meta").set(settings.model_dump())
    return {"message": "Meta settings updated successfully"}

@router.get("/leads")
async def get_meta_leads(
    leads = Depends(get_meta_leads_dep), 
    current_user: str = Depends(get_current_user)
):
    return leads


@router.get("/dms")
async def get_meta_dms(
    dms = Depends(get_meta_dms_dep), 
    current_user: str = Depends(get_current_user)
):
    return dms

@router.post("/dms/send")
async def send_meta_dm(
    req: SendDMRequest, 
    current_user: str = Depends(get_current_user)
):
    msg_id = f"dm_{uuid.uuid4().hex[:8]}"
    channel = "Facebook DM" if req.platform == "facebook" else "Instagram DM"
    
    new_message = {
        "id": msg_id,
        "from": "Sirisamruddhi Gold Palace",
        "to": req.recipient_id,
        "body": req.message_text,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "channel": channel,
        "platform_id": req.recipient_id
    }
    
    db.collection("messages").document(msg_id).set(new_message)
    
    return {"status": "success", "message": "DM sent successfully", "data": new_message}
