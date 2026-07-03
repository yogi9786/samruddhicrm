import os

class AuthService:
    @staticmethod
    def get_credentials() -> dict:
        # Load environment variables from .env if not loaded yet
        from dotenv import load_dotenv
        load_dotenv()
        return {
            "username": os.getenv("ADMIN_USERNAME", "siriadmin"),
            "password": os.getenv("ADMIN_PASSWORD", "siriadmin1234"),
            "is_custom": False
        }

    @staticmethod
    def update_credentials(username: str, password: str) -> None:
        # No-op since we are bypassing Firestore for authentication
        pass

    @staticmethod
    def reset_credentials() -> None:
        # No-op since we are bypassing Firestore for authentication
        pass
