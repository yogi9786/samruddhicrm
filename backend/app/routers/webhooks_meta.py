from fastapi import APIRouter, Request, HTTPException, Query
from fastapi.responses import PlainTextResponse
import os

router = APIRouter()

META_VERIFY_TOKEN = os.getenv("META_VERIFY_TOKEN", "your_secure_verify_token")

@router.get("/")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token")
):
    if hub_mode == "subscribe" and hub_verify_token == META_VERIFY_TOKEN:
        return PlainTextResponse(content=hub_challenge, status_code=200)
    
    raise HTTPException(status_code=403, detail="Verification failed")

@router.post("/")
async def receive_meta_update(request: Request):
    try:
        body = await request.json()
        
        if body.get("object") == "page":
            for entry in body.get("entry", []):
                for change in entry.get("changes", []):
                    if change.get("field") == "leadgen":
                        lead_data = change.get("value", {})
                        lead_id = lead_data.get("leadgen_id")
                        form_id = lead_data.get("form_id")
                        pass
                        
            return PlainTextResponse(content="EVENT_RECEIVED", status_code=200)
            
        return PlainTextResponse(content="NOT_SUPPORTED", status_code=404)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")
