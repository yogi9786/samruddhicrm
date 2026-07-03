from fastapi import APIRouter, Request, HTTPException, Query
from fastapi.responses import PlainTextResponse
import os
import logging
from app.services.meta_service import MetaService

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

router = APIRouter()

META_VERIFY_TOKEN = os.getenv("META_VERIFY_TOKEN", "your_secure_verify_token")


# =============================================================================
# GET — Meta Webhook Verification (required by Meta Developer portal)
# =============================================================================
@router.get("/")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token")
):
    """
    Meta calls this endpoint when you first save the webhook URL in the
    Developer Portal. It must respond with hub.challenge as plain text.
    """
    if hub_mode == "subscribe" and hub_verify_token == META_VERIFY_TOKEN:
        logger.info("Meta webhook verified successfully.")
        return PlainTextResponse(content=hub_challenge, status_code=200)

    logger.warning("Meta webhook verification failed — token mismatch.")
    raise HTTPException(status_code=403, detail="Verification failed")


# =============================================================================
# POST — Receive all Meta events (Leads, FB Messages, IG Messages)
# =============================================================================
@router.post("/")
async def receive_meta_update(request: Request):
    """
    Single entry point for all Meta webhook events:
      - object: "page"   → Facebook Leads (leadgen) + Facebook Messenger DMs
      - object: "instagram" → Instagram DMs
    """
    try:
        body = await request.json()
        object_type = body.get("object")

        # -------------------------
        # FACEBOOK PAGE EVENTS
        # -------------------------
        if object_type == "page":
            for entry in body.get("entry", []):

                # 1. Lead Ads — field: "leadgen"
                for change in entry.get("changes", []):
                    if change.get("field") == "leadgen":
                        value = change.get("value", {})
                        lead_id = value.get("leadgen_id")
                        form_id = value.get("form_id", "")
                        page_id = value.get("page_id", "")

                        logger.info(f"FB Lead received — lead_id: {lead_id}, form_id: {form_id}, page_id: {page_id}")

                        if lead_id:
                            # Fetch full details from Graph API and save to Firestore
                            saved = await MetaService.fetch_and_save_lead(lead_id, form_id)
                            if saved:
                                logger.info(f"Lead auto-saved to CRM: {saved.get('name')}")
                            else:
                                logger.warning(f"Lead {lead_id} could not be fully processed (token may be missing).")

                # 2. Facebook Messenger messages
                for messaging_event in entry.get("messaging", []):
                    sender_id = messaging_event.get("sender", {}).get("id", "unknown")
                    if "message" in messaging_event:
                        msg = messaging_event["message"]
                        message_text = msg.get("text", "")
                        if message_text:
                            logger.info(f"FB Message from {sender_id}: {message_text[:60]}")
                            MetaService.save_facebook_message(sender_id, message_text)

            return PlainTextResponse(content="EVENT_RECEIVED", status_code=200)

        # -------------------------
        # INSTAGRAM EVENTS
        # -------------------------
        elif object_type == "instagram":
            for entry in body.get("entry", []):
                for messaging_event in entry.get("messaging", []):
                    sender_id = messaging_event.get("sender", {}).get("id", "unknown")
                    if "message" in messaging_event:
                        msg = messaging_event["message"]
                        message_text = msg.get("text", "")
                        if message_text:
                            logger.info(f"IG Message from {sender_id}: {message_text[:60]}")
                            MetaService.save_instagram_message(sender_id, message_text)

            return PlainTextResponse(content="EVENT_RECEIVED", status_code=200)

        # -------------------------
        # UNSUPPORTED EVENT TYPE
        # -------------------------
        logger.info(f"Unsupported Meta object type: {object_type}")
        return PlainTextResponse(content="NOT_SUPPORTED", status_code=200)

    except Exception as e:
        logger.error(f"Error processing Meta webhook: {str(e)}", exc_info=True)
        # Always return 200 to Meta to prevent retries flooding your server
        return PlainTextResponse(content="ERROR_HANDLED", status_code=200)
