from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import verify_password, create_access_token
from app.models.auth import Token, AuthSettings
from app.services.auth import AuthService
from app.dependencies.deps import get_current_user

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    import asyncio
    import os
    try:
        credentials = await asyncio.wait_for(
            asyncio.to_thread(AuthService.get_credentials), 
            timeout=5.0
        )
    except (asyncio.TimeoutError, Exception) as e:
        print(f"Warning: AuthService.get_credentials timed out or failed: {e}")
        credentials = {
            "username": os.getenv("ADMIN_USERNAME", "siriadmin"),
            "password": os.getenv("ADMIN_PASSWORD", "siriadmin1234"),
            "is_custom": False
        }
        
    admin_username = credentials["username"]
    admin_password = credentials["password"]
    
    if form_data.username != admin_username or not verify_password(form_data.password, admin_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": form_data.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/settings")
async def get_auth_settings(current_user: str = Depends(get_current_user)):
    import asyncio
    import os
    try:
        credentials = await asyncio.wait_for(
            asyncio.to_thread(AuthService.get_credentials), 
            timeout=5.0
        )
    except (asyncio.TimeoutError, Exception) as e:
        print(f"Warning: AuthService.get_credentials timed out or failed: {e}")
        credentials = {
            "username": os.getenv("ADMIN_USERNAME", "siriadmin"),
            "password": os.getenv("ADMIN_PASSWORD", "siriadmin1234"),
            "is_custom": False
        }
    if not credentials.get("is_custom"):
        return {
            "username": "",
            "password": "",
            "is_custom": False
        }
    return {
        "username": credentials["username"],
        "password": credentials["password"],
        "is_custom": credentials["is_custom"]
    }

@router.post("/settings")
async def update_auth_settings(settings: AuthSettings, current_user: str = Depends(get_current_user)):
    AuthService.update_credentials(settings.username, settings.password)
    return {"status": "success", "message": "Credentials updated successfully"}

@router.delete("/settings")
async def delete_auth_settings(current_user: str = Depends(get_current_user)):
    AuthService.reset_credentials()
    return {"status": "success", "message": "Credentials reset to default values"}
