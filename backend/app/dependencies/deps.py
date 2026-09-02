from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import os
from pathlib import Path
from dotenv import load_dotenv
from typing import Optional
from app.core.security import SECRET_KEY, ALGORITHM
from app.core.database import get_db_connection, get_setting

# Load environment variables from .env
load_dotenv()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)):
    if not token:
        return os.getenv("ADMIN_USERNAME", "siriadmin")
    
    # 1. Try Custom JWT (for local admin login)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username:
            return username
    except Exception:
        pass

    # 2. Try unverified claims from Firebase/other JWT without blocking Google network calls
    try:
        unverified = jwt.get_unverified_claims(token)
        if unverified:
            user_id = unverified.get("email") or unverified.get("user_id") or unverified.get("sub")
            if user_id:
                return user_id
    except Exception:
        pass
        
    return os.getenv("ADMIN_USERNAME", "siriadmin")

def get_meta_settings_dep():
    default_settings = {
        "page_id": os.getenv("META_FACEBOOK_PAGE_ID", "1234567890"),
        "access_token": os.getenv("META_ACCESS_TOKEN", "EAAx..."),
        "verify_token": os.getenv("META_VERIFY_TOKEN", "your_secure_verify_token"),
        "is_active": False
    }
    return get_setting("meta", default_settings)

def get_meta_leads_dep():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM leads WHERE source = 'Meta Ads' ORDER BY createdAt DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        print(f"Error fetching meta leads: {e}")
        return []

def get_meta_dms_dep():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM messages WHERE channel IN ('Facebook DM', 'Instagram DM') ORDER BY timestamp ASC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        print(f"Error fetching meta DMs: {e}")
        return []
