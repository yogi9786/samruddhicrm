import os
from dotenv import load_dotenv

class AuthService:
    @staticmethod
    def get_credentials() -> dict:
        load_dotenv()
        # Accept dedicated CRM admin credentials or standard admin credentials
        crm_user = os.getenv("CRM_ADMIN_USERNAME") or os.getenv("ADMIN_USERNAME", "siriadmin")
        crm_pass = os.getenv("CRM_ADMIN_PASSWORD") or os.getenv("ADMIN_PASSWORD", "siriadmin1234")
        return {
            "username": crm_user,
            "password": crm_pass,
            "is_custom": False
        }

    @staticmethod
    def update_credentials(username: str, password: str) -> None:
        pass

    @staticmethod
    def reset_credentials() -> None:
        pass
