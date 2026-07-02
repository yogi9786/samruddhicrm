import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

db = None
firebase_initialized = False

try:
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    if cred_path:
        if not os.path.isabs(cred_path):
            backend_dir = Path(__file__).resolve().parents[2]
            cred_path = str(backend_dir / cred_path)
            
    if cred_path and os.path.exists(cred_path):
        import firebase_admin
        from firebase_admin import credentials, firestore
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        firebase_initialized = True
    else:
        import firebase_admin
        from firebase_admin import firestore
        firebase_admin.initialize_app()
        db = firestore.client()
        firebase_initialized = True
except Exception as e:
    raise RuntimeError(f"CRITICAL: Failed to initialize Firebase Admin SDK: {e}.")
