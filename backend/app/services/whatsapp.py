import os
import uuid
from datetime import datetime
from fastapi import HTTPException
from app.core.firebase import db

class WhatsAppService:
    @staticmethod
    async def get_settings() -> dict:
        settings_doc = db.collection("settings").document("whatsapp").get()
        if settings_doc.exists:
            return settings_doc.to_dict()
        return {
            "account_sid": os.getenv("TWILIO_ACCOUNT_SID", ""),
            "auth_token": os.getenv("TWILIO_AUTH_TOKEN", ""),
            "phone_number": os.getenv("TWILIO_PHONE_NUMBER", ""),
            "is_active": bool(os.getenv("TWILIO_ACCOUNT_SID"))
        }

    @staticmethod
    async def update_settings(settings_data: dict) -> None:
        db.collection("settings").document("whatsapp").set(settings_data)

    @staticmethod
    async def get_messages() -> list:
        messages_ref = db.collection("messages").stream()
        wa_messages = []
        for doc in messages_ref:
            msg = doc.to_dict()
            if msg.get("channel") == "WhatsApp":
                wa_messages.append(msg)
        return sorted(wa_messages, key=lambda x: x.get("timestamp", ""))

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
            "from": "Sirisamruddhi CRM",
            "to": to_number,
            "body": body,
            "timestamp": timestamp,
            "channel": "WhatsApp",
            "status": "Sent" if sent_successfully else "Failed",
            "error": twilio_error,
            "is_mocked": not sent_successfully
        }
        db.collection("messages").document(msg_id).set(new_msg)
        
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
        templates_ref = db.collection("whatsapp_templates").stream()
        return [doc.to_dict() for doc in templates_ref]

    @staticmethod
    async def save_template(name: str, body: str, category: str) -> dict:
        tpl_id = f"tpl_{uuid.uuid4().hex[:8]}"
        data = {
            "id": tpl_id,
            "name": name,
            "body": body,
            "category": category
        }
        db.collection("whatsapp_templates").document(tpl_id).set(data)
        return data
