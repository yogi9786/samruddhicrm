"""
Meta Integration Service
Handles: Graph API lead fetch, FB/IG message save to SQLite database
"""
import os
import logging
import uuid
from datetime import datetime

import httpx
from app.core.database import get_db_connection
from app.services.crm import CRMService

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN", "")
GRAPH_API_VERSION = "v18.0"
GRAPH_API_BASE = f"https://graph.facebook.com/{GRAPH_API_VERSION}"


class MetaService:

    # -------------------------------------------------------------------------
    # LEAD CAPTURE — Graph API fetch + SQLite save
    # -------------------------------------------------------------------------

    @staticmethod
    async def fetch_and_save_lead(lead_id: str, form_id: str = "") -> dict | None:
        """
        Fetches full lead data from Meta Graph API using lead_id,
        then saves it to SQLite as a CRM lead.
        Returns the saved lead dict or None on failure.
        """
        if not META_ACCESS_TOKEN or META_ACCESS_TOKEN == "your_page_or_system_user_access_token":
            logger.warning("META_ACCESS_TOKEN not configured. Cannot fetch lead details.")
            return None

        url = f"{GRAPH_API_BASE}/{lead_id}"
        params = {
            "fields": "field_data,created_time,ad_id,ad_name,form_id,page_id",
            "access_token": META_ACCESS_TOKEN
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Meta Graph API error for lead {lead_id}: {e.response.status_code} — {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"Failed to call Meta Graph API: {str(e)}")
            return None

        # Parse field_data array: [{"name": "full_name", "values": ["John"]}, ...]
        field_data: list = data.get("field_data", [])
        parsed = {item["name"]: item["values"][0] for item in field_data if item.get("values")}

        name = parsed.get("full_name") or (parsed.get("first_name", "") + " " + parsed.get("last_name", "")).strip()
        name = name or "Meta Lead"
        email = parsed.get("email", "")
        phone = parsed.get("phone_number") or parsed.get("phone", "")

        # Determine source from ad/form name
        ad_name: str = data.get("ad_name", "")
        source = "Instagram Ads" if "instagram" in ad_name.lower() or "ig" in ad_name.lower() else "Facebook Ads"

        lead_doc = {
            "id": f"lead_{uuid.uuid4().hex[:8]}",
            "name": name,
            "email": email,
            "phone": phone,
            "source": source,
            "status": "New Lead",
            "interestedIn": "Gold Jewelry",
            "notes": f"Auto-captured from Meta Ads. Form ID: {form_id or data.get('form_id', '')} | Lead ID: {lead_id}",
            "createdAt": datetime.utcnow().isoformat() + "Z",
        }

        # Save to SQLite CRM
        try:
            saved_lead = await CRMService.create_lead(lead_doc)
            logger.info(f"Meta lead saved to SQLite: {lead_doc['id']} — {name}")
            return saved_lead
        except Exception as e:
            logger.error(f"Failed to save Meta lead to SQLite: {str(e)}")
            return None

    # -------------------------------------------------------------------------
    # FACEBOOK MESSENGER — Save incoming message to SQLite
    # -------------------------------------------------------------------------

    @staticmethod
    def save_facebook_message(sender_id: str, message_text: str) -> dict:
        """
        Saves an incoming Facebook Messenger message to the messages table.
        """
        msg_id = f"dm_{uuid.uuid4().hex[:8]}"
        message_doc = {
            "id": msg_id,
            "sender": sender_id,
            "recipient": "page",
            "body": message_text,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "channel": "Facebook DM",
            "platform_id": sender_id,
            "status": "received"
        }
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO messages (id, sender, recipient, body, timestamp, channel, platform_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (message_doc["id"], message_doc["sender"], message_doc["recipient"], message_doc["body"], message_doc["timestamp"], message_doc["channel"], message_doc["platform_id"], message_doc["status"]))
            conn.commit()
            conn.close()
            logger.info(f"Saved FB message from {sender_id} to SQLite")
        except Exception as e:
            logger.error(f"Failed to save FB message: {str(e)}")
        return message_doc

    # -------------------------------------------------------------------------
    # INSTAGRAM — Save incoming message to SQLite
    # -------------------------------------------------------------------------

    @staticmethod
    def save_instagram_message(sender_id: str, message_text: str) -> dict:
        """
        Saves an incoming Instagram DM to the messages table.
        """
        msg_id = f"dm_{uuid.uuid4().hex[:8]}"
        message_doc = {
            "id": msg_id,
            "sender": sender_id,
            "recipient": "instagram_business",
            "body": message_text,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "channel": "Instagram DM",
            "platform_id": sender_id,
            "status": "received"
        }
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO messages (id, sender, recipient, body, timestamp, channel, platform_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (message_doc["id"], message_doc["sender"], message_doc["recipient"], message_doc["body"], message_doc["timestamp"], message_doc["channel"], message_doc["platform_id"], message_doc["status"]))
            conn.commit()
            conn.close()
            logger.info(f"Saved IG message from {sender_id} to SQLite")
        except Exception as e:
            logger.error(f"Failed to save IG message: {str(e)}")
        return message_doc
