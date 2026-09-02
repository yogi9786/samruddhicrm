import os
import uuid
import json
from datetime import datetime
from fastapi import HTTPException
from app.core.database import get_db_connection, get_setting, set_setting

class WhatsAppService:
    @staticmethod
    async def get_settings() -> dict:
        default_settings = {
            "account_sid": os.getenv("TWILIO_ACCOUNT_SID", ""),
            "auth_token": os.getenv("TWILIO_AUTH_TOKEN", ""),
            "phone_number": os.getenv("TWILIO_PHONE_NUMBER", ""),
            "is_active": bool(os.getenv("TWILIO_ACCOUNT_SID"))
        }
        return get_setting("whatsapp", default_settings)

    @staticmethod
    async def update_settings(settings_data: dict) -> None:
        set_setting("whatsapp", settings_data)

    @staticmethod
    async def get_messages() -> list:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM messages WHERE channel = 'WhatsApp' ORDER BY timestamp ASC")
            rows = cursor.fetchall()
            conn.close()
            return [dict(r) for r in rows]
        except Exception as e:
            print(f"Error fetching whatsapp messages: {e}")
            return []

    @staticmethod
    async def send_message(to_number: str, body: str) -> dict:
        settings = await WhatsAppService.get_settings()
        
        account_sid = settings.get("account_sid") or os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = settings.get("auth_token") or os.getenv("TWILIO_AUTH_TOKEN")
        from_number = settings.get("phone_number") or os.getenv("TWILIO_PHONE_NUMBER")
        is_active = settings.get("is_active", True)

        if not account_sid or not auth_token or not from_number:
            raise HTTPException(status_code=400, detail="Twilio account SID, auth token or phone number is missing. Configure it in WhatsApp settings.")
        if not is_active:
            raise HTTPException(status_code=400, detail="WhatsApp service integration is currently inactive.")
        
        msg_id = f"wa_{uuid.uuid4().hex[:8]}"
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        sent_successfully = False
        twilio_error = None
        
        try:
            from twilio.rest import Client
            client = Client(account_sid, auth_token)
            prefix_from = f"whatsapp:{from_number}" if not from_number.startswith("whatsapp:") else from_number
            prefix_to = f"whatsapp:{to_number}" if not to_number.startswith("whatsapp:") else to_number
            
            client.messages.create(
                body=body,
                from_=prefix_from,
                to=prefix_to
            )
            sent_successfully = True
        except Exception as e:
            twilio_error = str(e)
        
        new_msg = {
            "id": msg_id,
            "sender": "Sirisamruddhi CRM",
            "recipient": to_number,
            "body": body,
            "timestamp": timestamp,
            "channel": "WhatsApp",
            "platform_id": to_number,
            "status": "Sent" if sent_successfully else "Failed"
        }
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO messages (id, sender, recipient, body, timestamp, channel, platform_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (new_msg["id"], new_msg["sender"], new_msg["recipient"], new_msg["body"], new_msg["timestamp"], new_msg["channel"], new_msg["platform_id"], new_msg["status"]))
        conn.commit()
        conn.close()
        
        if not sent_successfully:
            raise HTTPException(status_code=500, detail=twilio_error or "Twilio WhatsApp sending failed.")
            
        return new_msg

    @staticmethod
    async def send_bulk(to_numbers: list, body: str) -> list:
        results = []
        for number in to_numbers:
            try:
                await WhatsAppService.send_message(number, body)
                results.append({"number": number, "status": "success"})
            except Exception as e:
                results.append({"number": number, "status": "error", "detail": str(e)})
        return results

    @staticmethod
    async def get_templates() -> list:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM whatsapp_templates ORDER BY rowid DESC")
            rows = cursor.fetchall()
            conn.close()
            return [dict(r) for r in rows]
        except Exception as e:
            print(f"Error fetching whatsapp templates: {e}")
            return []

    @staticmethod
    async def save_template(name: str, body: str, category: str) -> dict:
        tpl_id = f"tpl_{uuid.uuid4().hex[:8]}"
        data = {
            "id": tpl_id,
            "name": name,
            "body": body,
            "category": category,
            "language": "en",
            "status": "APPROVED",
            "variables": "[]"
        }
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO whatsapp_templates (id, name, category, language, body, status, variables)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (data["id"], data["name"], data["category"], data["language"], data["body"], data["status"], data["variables"]))
        conn.commit()
        conn.close()
        return data
