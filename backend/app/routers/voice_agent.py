from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from app.dependencies.deps import get_current_user
from app.services.voice_agent import VoiceAgentService
from app.services.crm import CRMService

router = APIRouter()

class InitiateCallRequest(BaseModel):
    leadId: Optional[str] = None
    phone: Optional[str] = None
    name: Optional[str] = None
    callType: Optional[str] = "indian_voice"
    metadata: Optional[Dict[str, Any]] = None

class ReplyRequest(BaseModel):
    text: str
    customerName: Optional[str] = "Customer"
    interest: Optional[str] = "Gold Jewelry"

class TranscriptAnalyzeRequest(BaseModel):
    transcript: List[Dict[str, Any]]
    leadName: Optional[str] = ""
    leadId: Optional[str] = None
    autoSave: Optional[bool] = True

class VoiceSettingsRequest(BaseModel):
    provider: Optional[str] = "indian_ai"
    vapi_api_key: Optional[str] = ""
    vapi_phone_number_id: Optional[str] = ""
    vapi_assistant_id: Optional[str] = ""
    retell_api_key: Optional[str] = ""
    retell_agent_id: Optional[str] = ""
    is_active: Optional[bool] = True

@router.get("/settings")
async def get_voice_settings(current_user: str = Depends(get_current_user)):
    return await VoiceAgentService.get_settings()

@router.post("/settings")
async def update_voice_settings(settings: VoiceSettingsRequest, current_user: str = Depends(get_current_user)):
    return await VoiceAgentService.update_settings(settings.model_dump())

@router.post("/call")
async def initiate_voice_call(req: InitiateCallRequest, current_user: str = Depends(get_current_user)):
    """
    Triggers an Indian AI voice call session for a lead.
    """
    return await VoiceAgentService.initiate_call(
        lead_id=req.leadId,
        phone=req.phone,
        name=req.name,
        call_type=req.callType or "indian_voice",
        metadata=req.metadata
    )

@router.post("/reply")
async def generate_voice_reply(req: ReplyRequest, current_user: str = Depends(get_current_user)):
    """
    Generates an intelligent showroom sales assistant reply without external API keys.
    """
    reply = VoiceAgentService.generate_reply(
        customer_text=req.text,
        customer_name=req.customerName or "Customer",
        interest=req.interest or "Gold Jewelry"
    )
    return {"reply": reply}

@router.post("/analyze")
async def analyze_voice_transcript(req: TranscriptAnalyzeRequest, current_user: str = Depends(get_current_user)):
    """
    Parses a call transcript into structured lead qualification and saves to SQLite CRM.
    """
    analysis = VoiceAgentService.analyze_transcript(req.transcript, lead_name=req.leadName or "")
    
    if req.autoSave and req.leadId:
        call_log = {
            "callType": "indian_voice_call",
            "transcript": req.transcript,
            "qualification": analysis,
            "notes": analysis.get("summaryNotes", ""),
            "status": "Interested" if analysis.get("outcome") == "Wants Showroom Visit" else "Contacted"
        }
        await CRMService.save_call_log(req.leadId, call_log)
        
    return analysis
