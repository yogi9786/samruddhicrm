from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import PlainTextResponse

router = APIRouter()

@router.post("/")
async def receive_whatsapp_message(request: Request):
    try:
        form_data = await request.form()
        from_number = form_data.get("From", "")
        body = form_data.get("Body", "")
        pass
        
        twiml_response = "<Response></Response>"
        return PlainTextResponse(content=twiml_response, media_type="application/xml")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")
