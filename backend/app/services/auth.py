import os
from app.core.firebase import db

class AuthService:
    @staticmethod
    def get_credentials() -> dict:
        # Query custom credentials in Firestore settings
        doc = db.collection("settings").document("auth").get()
        if doc.exists:
            data = doc.to_dict()
            return {
                "username": data.get("username"),
                "password": data.get("password"),
                "is_custom": True
            }
        
        # Default fallback to environment configs
        return {
            "username": os.getenv("ADMIN_USERNAME", "siriadmin"),
            "password": os.getenv("ADMIN_PASSWORD", "siriadmin1234"),
            "is_custom": False
        }

    @staticmethod
    def update_credentials(username: str, password: str) -> None:
        db.collection("settings").document("auth").set({
            "username": username,
            "password": password
        })

    @staticmethod
    def reset_credentials() -> None:
        db.collection("settings").document("auth").delete()
