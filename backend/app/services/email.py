import os
import uuid
import httpx
from datetime import datetime
from fastapi import HTTPException
from app.core.firebase import db

class EmailService:
    @staticmethod
    async def get_settings() -> dict:
        settings_doc = db.collection("settings").document("email").get()
        if settings_doc.exists:
            return settings_doc.to_dict()
        return {
            "api_key": os.getenv("BREVO_API_KEY", ""),
            "sender_email": os.getenv("SENDER_EMAIL", "info@sirisamruddhi.com"),
            "sender_name": "Sirisamruddhi Gold Palace",
            "is_active": bool(os.getenv("BREVO_API_KEY"))
        }

    @staticmethod
    async def update_settings(settings_data: dict) -> None:
        db.collection("settings").document("email").set(settings_data)

    @staticmethod
    async def get_logs() -> list:
        logs_ref = db.collection("email_logs").stream()
        return [doc.to_dict() for doc in logs_ref]

    @staticmethod
    async def send_email(
        to_email: str, 
        subject: str, 
        body: str, 
        attachment_name: str = None, 
        attachment_content: str = None
    ) -> dict:
        settings = await EmailService.get_settings()
        
        api_key = settings.get("api_key") or os.getenv("BREVO_API_KEY")
        sender_email = settings.get("sender_email") or os.getenv("SENDER_EMAIL", "info@sirisamruddhi.com")
        sender_name = settings.get("sender_name") or "Sirisamruddhi Gold Palace"
        is_active = settings.get("is_active", True)

        if not api_key:
            raise HTTPException(status_code=400, detail="Brevo API Key is missing. Please configure it in Email settings.")
        if not is_active:
            raise HTTPException(status_code=400, detail="Email service integration is currently inactive.")

        email_id = f"email_{uuid.uuid4().hex[:8]}"
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        sent_successfully = False
        error_message = None
        
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "accept": "application/json",
            "api-key": api_key,
            "content-type": "application/json"
        }
        payload = {
            "sender": {"name": sender_name, "email": sender_email},
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": f"<html><body>{body}</body></html>"
        }
        
        if attachment_name and attachment_content:
            # Brevo API expects: [{"name": "file.txt", "content": "base64String"}]
            payload["attachment"] = [{
                "name": attachment_name,
                "content": attachment_content
            }]
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json=payload, timeout=15.0)
                if response.status_code in [200, 201, 202]:
                    sent_successfully = True
                else:
                    try:
                        resp_data = response.json()
                        error_message = f"Brevo API error: {response.status_code} - {resp_data.get('message', response.text)}"
                    except Exception:
                        error_message = f"Brevo API error: {response.status_code} - {response.text}"
        except Exception as e:
            error_message = f"HTTP connection failed: {str(e)}"
            
        email_log = {
            "id": email_id,
            "to_email": to_email,
            "subject": subject,
            "timestamp": timestamp,
            "status": "Delivered" if sent_successfully else "Failed",
            "opens": 0,
            "clicks": 0,
            "error": error_message,
            "is_mocked": not sent_successfully
        }
        db.collection("email_logs").document(email_id).set(email_log)
        
        if not sent_successfully:
            raise HTTPException(status_code=500, detail=error_message or "Brevo Email dispatch failed.")
            
        return email_log

    @staticmethod
    async def send_bulk(
        to_emails: list, 
        subject: str, 
        body: str, 
        attachment_name: str = None, 
        attachment_content: str = None
    ) -> list:
        results = []
        for email in to_emails:
            try:
                log = await EmailService.send_email(
                    to_email=email,
                    subject=subject,
                    body=body,
                    attachment_name=attachment_name,
                    attachment_content=attachment_content
                )
                results.append({"email": email, "status": "success", "log_id": log.get("id")})
            except Exception as e:
                # Catch HTTPException or others to report exact status in bulk logs
                error_detail = str(e)
                if hasattr(e, "detail"):
                    error_detail = getattr(e, "detail")
                results.append({"email": email, "status": "error", "detail": error_detail})
        return results
