import os
import sys
import asyncio
import httpx
from pathlib import Path
from dotenv import load_dotenv

# Search candidate .env paths
candidates = [
    Path(__file__).resolve().parents[1] / ".env",
    Path(__file__).resolve().parents[2] / ".env",
    Path.cwd() / ".env",
    Path.cwd() / "backend" / ".env"
]

loaded_file = None
for cp in candidates:
    if cp.exists():
        load_dotenv(dotenv_path=cp, override=True)
        loaded_file = str(cp)
        break
else:
    load_dotenv(override=True)

print("=" * 60)
print("DIAGNOSTIC: DIGINTRA SMS OTP CONFIGURATION TEST")
print("=" * 60)
print(f"Loaded .env from: {loaded_file or 'Default environment'}")

client_id = os.getenv("DIGINTRA_CLIENT_ID", "").strip()
api_key = os.getenv("DIGINTRA_API_KEY", "").strip()
sender_id = os.getenv("DIGINTRA_SENDER_ID", "SSGPJW").strip()
template_id = os.getenv("DIGINTRA_OTP_TEMPLATE_ID", "").strip()
template_text = os.getenv("DIGINTRA_OTP_TEMPLATE_TEXT", "").strip()
endpoint_url = os.getenv("DIGINTRA_BASE_URL", "").strip().rstrip("/") or "https://sms-login.digintra.com/api/v2/SendSMS"

print(f"DIGINTRA_CLIENT_ID: {'[CONFIGURED]' if client_id else '[MISSING ❌]'}")
print(f"DIGINTRA_API_KEY:   {'[CONFIGURED]' if api_key else '[MISSING ❌]'} (Length: {len(api_key)})")
print(f"DIGINTRA_SENDER_ID: {sender_id}")
print(f"TEMPLATE_ID:        {template_id}")
print(f"ENDPOINT_URL:       {endpoint_url}")

if not api_key:
    print("\n❌ ERROR: DIGINTRA_API_KEY is not found in .env!")
    print("Please check your .env file and ensure DIGINTRA_API_KEY=... is set.")
    sys.exit(1)

test_mobile = sys.argv[1] if len(sys.argv) > 1 else "7996633015"
test_otp = "123456"
message_text = template_text.replace("{#var#}", test_otp).replace("{otp}", test_otp)

payload = {
    "ApiKey": api_key,
    "ClientId": client_id,
    "SenderId": sender_id,
    "Message": message_text,
    "MobileNumbers": test_mobile,
    "TemplateId": template_id
}

print(f"\nSending Live Test SMS to: +91{test_mobile}")
print(f"Message: '{message_text}'")

async def send():
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(
                endpoint_url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            print(f"\nHTTP Status: {resp.status_code}")
            print(f"Response Body: {resp.text}")
            res_json = resp.json()
            if res_json.get("ErrorCode") == 0:
                print("\n✅ SUCCESS: Digintra accepted the SMS! Check your phone & Digintra portal.")
            else:
                print(f"\n⚠️ DIGINTRA REJECTED: ErrorCode={res_json.get('ErrorCode')}, Desc={res_json.get('ErrorDescription')}")
        except Exception as e:
            print(f"\n❌ Network / Dispatch Exception: {e}")

asyncio.run(send())
print("=" * 60)
