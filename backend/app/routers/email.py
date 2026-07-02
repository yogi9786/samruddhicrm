from fastapi import APIRouter, Depends
from app.dependencies.deps import get_current_user
from app.models.email import EmailSettings, SendEmailRequest, SendBulkEmailRequest
from app.services.email import EmailService

router = APIRouter()

@router.get("/settings")
async def get_email_settings(current_user: str = Depends(get_current_user)):
    return await EmailService.get_settings()

@router.post("/settings")
async def update_email_settings(settings: EmailSettings, current_user: str = Depends(get_current_user)):
    await EmailService.update_settings(settings.model_dump())
    return {"message": "Email settings updated successfully"}

@router.get("/logs")
async def get_email_logs(current_user: str = Depends(get_current_user)):
    return await EmailService.get_logs()

@router.post("/send")
async def send_email(
    req: SendEmailRequest,
    current_user: str = Depends(get_current_user)
):
    log = await EmailService.send_email(
        to_email=req.to_email,
        subject=req.subject,
        body=req.body,
        attachment_name=req.attachment_name,
        attachment_content=req.attachment_content
    )
    return {"status": "success", "log": log}

@router.post("/send-bulk")
async def send_bulk_email(
    req: SendBulkEmailRequest,
    current_user: str = Depends(get_current_user)
):
    results = await EmailService.send_bulk(
        to_emails=req.to_emails,
        subject=req.subject,
        body=req.body,
        attachment_name=req.attachment_name,
        attachment_content=req.attachment_content
    )
    return {"status": "success", "results": results}
