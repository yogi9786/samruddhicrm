from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import os
from pathlib import Path
from dotenv import load_dotenv
from app.core.security import SECRET_KEY, ALGORITHM

# Load environment variables from .env
load_dotenv()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 1. Try Custom JWT (for local admin login)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is not None:
            import asyncio
            import os
            from app.services.auth import AuthService
            
            try:
                active_auth = await asyncio.wait_for(
                    asyncio.to_thread(AuthService.get_credentials),
                    timeout=5.0
                )
            except (asyncio.TimeoutError, Exception) as e:
                print(f"Warning: AuthService.get_credentials timed out in deps.py: {e}")
                active_auth = {
                    "username": os.getenv("ADMIN_USERNAME", "siriadmin"),
                    "password": os.getenv("ADMIN_PASSWORD", "siriadmin1234"),
                    "is_custom": False
                }
                
            if username == active_auth.get("username"):
                return username
    except JWTError:
        pass

    # 2. Try Firebase ID Token
    try:
        from app.core.firebase import firebase_initialized
        if firebase_initialized:
            from firebase_admin import auth as firebase_auth
            decoded_token = firebase_auth.verify_id_token(token)
            return decoded_token.get("email") or decoded_token.get("uid") or "firebase_user"
    except Exception:
        pass
        
    raise credentials_exception

def get_meta_settings_dep():
    from app.core.firebase import db
    settings_doc = db.collection("settings").document("meta").get()
    if settings_doc.exists:
        return settings_doc.to_dict()
    return {
        "page_id": "1234567890",
        "access_token": "EAAx...",
        "verify_token": "your_secure_verify_token",
        "is_active": False
    }

def get_meta_leads_dep():
    from app.core.firebase import db
    leads_ref = db.collection("leads").stream()
    meta_leads = []
    for doc in leads_ref:
        lead = doc.to_dict()
        if lead.get("source") == "Meta Ads":
            meta_leads.append(lead)
    return meta_leads

def get_meta_dms_dep():
    from app.core.firebase import db
    dms_ref = db.collection("messages").stream()
    dms = []
    for doc in dms_ref:
        msg = doc.to_dict()
        if msg.get("channel") in ["Facebook DM", "Instagram DM"]:
            dms.append(msg)
    return dms
