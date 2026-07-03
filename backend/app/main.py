from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import webhooks_whatsapp, webhooks_meta, auth, analytics, meta, whatsapp, email, crm

app = FastAPI(
    title="Sirisamruddhi CRM API",
    description="Backend API for the full-stack CRM",
    version="1.0.0"
)

# Configure CORS for frontend access
origins = [
    "http://localhost:5173",   # Vite default port (named)
    "http://127.0.0.1:5173",   # Vite default port (IPv4 explicit)
    "http://localhost:3000",   # Alt dev port
    "http://127.0.0.1:3000",   # Alt dev port (IPv4 explicit)
    # Add production frontend URL later
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(meta.router, prefix="/api/meta", tags=["Meta"])
app.include_router(whatsapp.router, prefix="/api/whatsapp", tags=["WhatsApp"])
app.include_router(email.router, prefix="/api/email", tags=["Email"])
app.include_router(crm.router, prefix="/api/crm", tags=["CRM"])

app.include_router(webhooks_whatsapp.router, prefix="/api/webhooks/whatsapp", tags=["WhatsApp Webhooks"])
app.include_router(webhooks_meta.router, prefix="/api/webhooks/meta", tags=["Meta Webhooks"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Sirisamruddhi CRM API"} 

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
