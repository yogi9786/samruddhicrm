import os
import uuid
import httpx
from datetime import datetime
from fastapi import HTTPException
from app.core.database import get_db_connection, get_setting, set_setting

class EmailService:
    @staticmethod
    async def get_settings() -> dict:
        default_settings = {
            "api_key": os.getenv("BREVO_API_KEY", ""),
            "sender_email": os.getenv("SENDER_EMAIL", "info@sirisamruddhi.com"),
            "sender_name": "Sirisamruddhi Gold Palace",
            "is_active": bool(os.getenv("BREVO_API_KEY"))
        }
        return get_setting("email", default_settings)

    @staticmethod
    async def update_settings(settings_data: dict) -> None:
        set_setting("email", settings_data)

    @staticmethod
    async def get_logs() -> list:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM email_logs ORDER BY timestamp DESC")
            rows = cursor.fetchall()
            conn.close()
            return [dict(r) for r in rows]
        except Exception as e:
            print(f"Error fetching email logs: {e}")
            return []

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
            "messageId": email_id,
            "error": error_message,
            "body": body
        }
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO email_logs (id, to_email, subject, timestamp, status, messageId, error, body)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (email_log["id"], email_log["to_email"], email_log["subject"], email_log["timestamp"], email_log["status"], email_log["messageId"], email_log["error"], email_log["body"]))
        conn.commit()
        conn.close()
        
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
                error_detail = str(e)
                if hasattr(e, "detail"):
                    error_detail = getattr(e, "detail")
                results.append({"email": email, "status": "error", "detail": error_detail})
        return results
