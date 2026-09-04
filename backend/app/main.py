import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import (
    webhooks_whatsapp, webhooks_meta, auth, analytics, meta,
    whatsapp, email, crm, voice_agent, gmb, gmb_admin
)
from app.core.database import auto_migrate_databases

app = FastAPI(
    title="Sirisamruddhi CRM & GBM Event Management API",
    description="Backend API for CRM and GBM Event Registration, Passes, QR Entry & Gift Management",
    version="2.0.0"
)

@app.on_event("startup")
def on_startup():
    auto_migrate_databases()


# Configure CORS for frontend access
origins = [
    "http://localhost:5173",   # Vite default port (named)
    "http://127.0.0.1:5173",   # Vite default port (IPv4 explicit)
    "http://localhost:3000",   # Alt dev port
    "http://127.0.0.1:3000",   # Alt dev port (IPv4 explicit)
    "https://sirisamruddhigold.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include CRM Routers
app.include_router(auth.router, prefix="/api/auth", tags=["CRM Auth"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["CRM Analytics"])
app.include_router(meta.router, prefix="/api/meta", tags=["CRM Meta"])
app.include_router(whatsapp.router, prefix="/api/whatsapp", tags=["CRM WhatsApp"])
app.include_router(email.router, prefix="/api/email", tags=["CRM Email"])
app.include_router(crm.router, prefix="/api/crm", tags=["CRM"])
app.include_router(voice_agent.router, prefix="/api/voice-agent", tags=["CRM AI Voice Agent"])
app.include_router(webhooks_whatsapp.router, prefix="/api/webhooks/whatsapp", tags=["CRM WhatsApp Webhooks"])
app.include_router(webhooks_meta.router, prefix="/api/webhooks/meta", tags=["CRM Meta Webhooks"])

# Include GBM Event Management Routers (mounted on both /api/gbm and /api/gmb)
app.include_router(gmb.router, prefix="/api/gbm", tags=["GBM Public Registration & Pass"])
app.include_router(gmb_admin.router, prefix="/api/gbm/admin", tags=["GBM Admin & Staff Operations"])

app.include_router(gmb.router, prefix="/api/gmb", tags=["GBM Public Registration & Pass (Legacy Alias)"])
app.include_router(gmb_admin.router, prefix="/api/gmb/admin", tags=["GBM Admin & Staff Operations (Legacy Alias)"])

# Static file serving for uploads (photos, qr codes, passes)
UPLOADS_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

@app.get("/")
def read_root():
    return {
        "name": "Sirisamruddhi API",
        "status": "online",
        "version": "2.0.0",
        "gbm_event": "GBM Annual Event 2026"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
