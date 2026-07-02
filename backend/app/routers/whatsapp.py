from fastapi import APIRouter, Depends
from app.dependencies.deps import get_current_user
from app.models.whatsapp import WhatsAppSettings, SendMessageRequest, SendBulkRequest, TemplateRequest
from app.services.whatsapp import WhatsAppService

router = APIRouter()

@router.get("/settings")
async def get_whatsapp_settings(current_user: str = Depends(get_current_user)):
    return await WhatsAppService.get_settings()

@router.post("/settings")
async def update_whatsapp_settings(settings: WhatsAppSettings, current_user: str = Depends(get_current_user)):
    await WhatsAppService.update_settings(settings.model_dump())
    return {"message": "WhatsApp Twilio settings updated successfully"}

@router.get("/messages")
async def get_whatsapp_messages(current_user: str = Depends(get_current_user)):
    return await WhatsAppService.get_messages()

@router.post("/send")
async def send_whatsapp_message(req: SendMessageRequest, current_user: str = Depends(get_current_user)):
    msg = await WhatsAppService.send_message(req.to_number, req.body)
    return {"status": "success", "message": msg}

@router.post("/send-bulk")
async def send_bulk_whatsapp(req: SendBulkRequest, current_user: str = Depends(get_current_user)):
    results = await WhatsAppService.send_bulk(req.to_numbers, req.body)
    return {"status": "success", "results": results}

@router.get("/templates")
async def get_whatsapp_templates(current_user: str = Depends(get_current_user)):
    return await WhatsAppService.get_templates()

@router.post("/templates")
async def save_whatsapp_template(template: TemplateRequest, current_user: str = Depends(get_current_user)):
    data = await WhatsAppService.save_template(template.name, template.body, template.category)
    return {"status": "success", "template": data}
