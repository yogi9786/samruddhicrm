import os
import uuid
import base64
from pathlib import Path
from datetime import datetime
from typing import Tuple, Optional
import httpx
from dotenv import load_dotenv
from app.core.database import get_db_connection

load_dotenv()

# AiSensy Configuration
AISENSY_API_KEY = os.getenv("AISENSY_API_KEY", "")
AISENSY_BASE_URL = os.getenv("AISENSY_BASE_URL", "https://backend.aisensy.com")
AISENSY_TEMPLATE_NAME = os.getenv("AISENSY_TEMPLATE_NAME", "")
AISENSY_CAMPAIGN_NAME = os.getenv("AISENSY_CAMPAIGN_NAME", "gmb_event_pass")

# Brevo Configuration
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", "ssgphost@gmail.com")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "Siri Samruddhi Gold Palace")

class AiSensyService:
    @staticmethod
    async def send_whatsapp_pass(registration_id: str, mobile: str, name: str, download_url: str) -> Tuple[bool, str]:
        """
        Sends WhatsApp message with event pass download link via AiSensy.
        Logs every attempt to gmb_whatsapp_logs.
        """
        log_id = f"wa_{uuid.uuid4().hex[:12]}"
        now = datetime.now().isoformat() + "Z"
        status = "PENDING"
        error_msg = ""
        payload_str = ""

        try:
            if AISENSY_API_KEY:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    endpoint = f"{AISENSY_BASE_URL.rstrip('/')}/campaign/t1/api/v2"
                    headers = {
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {AISENSY_API_KEY}"
                    }
                    body = {
                        "apiKey": AISENSY_API_KEY,
                        "campaignName": AISENSY_CAMPAIGN_NAME or "gmb_event_pass",
                        "destination": f"91{mobile}",
                        "userName": name,
                        "templateParams": [name, download_url],
                        "source": "gmb_registration_crm"
                    }
                    resp = await client.post(endpoint, json=body, headers=headers)
                    payload_str = resp.text
                    if resp.status_code in (200, 201, 202):
                        status = "SENT"
                    else:
                        status = "FAILED"
                        error_msg = f"AiSensy HTTP {resp.status_code}: {resp.text}"
            else:
                # Mock / Development mode
                status = "SENT"
                payload_str = f"Mock WhatsApp message delivered to +91{mobile}: Hello {name}, your pass is ready at {download_url}"
                print(f"[DEVELOPMENT WHATSAPP] To +91{mobile}: {download_url}")
        except Exception as e:
            status = "FAILED"
            error_msg = str(e)
            print(f"AiSensy delivery error: {e}")

        # Persist log
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO gmb_whatsapp_logs (id, registration_id, mobile, template_name, status, error_message, response_payload, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (log_id, registration_id, mobile, AISENSY_TEMPLATE_NAME or "gmb_event_pass", status, error_msg, payload_str, now))
            conn.commit()
            conn.close()
        except Exception as db_e:
            print(f"Database error writing WhatsApp log: {db_e}")

        return (status == "SENT"), status

class BrevoEmailService:
    @staticmethod
    async def send_email_pass(
        registration_id: str,
        email: str,
        name: str,
        pdf_path: str,
        download_url: str,
        employee_id: str = "",
        branch_name: str = "Siri Samruddhi Gold Palace"
    ) -> Tuple[bool, str]:
        """
        Sends the personalized PDF pass via Brevo Transactional Email API without needing
        a Brevo template ID by injecting a full standalone luxury HTML template created in code.
        Logs every attempt to gmb_email_logs.
        """
        if not email or not email.strip():
            return False, "NO_EMAIL_PROVIDED"

        log_id = f"em_{uuid.uuid4().hex[:12]}"
        now = datetime.now().isoformat() + "Z"
        status = "PENDING"
        error_msg = ""
        message_id = ""

        try:
            if BREVO_API_KEY:
                # Read PDF and encode base64
                pdf_b64 = ""
                if pdf_path and os.path.exists(pdf_path):
                    with open(pdf_path, "rb") as f:
                        pdf_b64 = base64.b64encode(f.read()).decode("utf-8")

                async with httpx.AsyncClient(timeout=15.0) as client:
                    endpoint = "https://api.brevo.com/v3/smtp/email"
                    headers = {
                        "api-key": BREVO_API_KEY,
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    }
                    
                    # Full rich HTML Template coded directly in Python
                    html_content = f"""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>GBM Annual Event 2026 Pass</title>
                    </head>
                    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
                            <tr>
                                <td align="center" style="padding: 24px 12px;">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #fde68a; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
                                        <!-- Luxury Gold Header -->
                                        <tr>
                                            <td align="center" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 24px; border-bottom: 3px solid #f59e0b;">
                                                <h1 style="margin: 0; color: #f59e0b; font-size: 22px; letter-spacing: 2px; text-transform: uppercase; font-family: Georgia, serif;">SIRI SAMRUDDHI</h1>
                                                <p style="margin: 4px 0 0 0; color: #fde68a; font-size: 11px; letter-spacing: 4px; text-transform: uppercase;">GOLD PALACE</p>
                                                <div style="margin-top: 14px; display: inline-block; padding: 4px 16px; background-color: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); border-radius: 20px;">
                                                    <span style="color: #fbbf24; font-size: 12px; font-weight: bold; letter-spacing: 1px;">GBM ANNUAL EVENT 2026</span>
                                                </div>
                                            </td>
                                        </tr>

                                        <!-- Body Content -->
                                        <tr>
                                            <td style="padding: 32px 28px;">
                                                <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 700;">
                                                    Welcome, {name}!
                                                </h2>
                                                <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                                                    Your delegate registration for the <strong>GBM Annual Event 2026</strong> has been successfully confirmed. We are honored to welcome you to our celebration of excellence.
                                                </p>

                                                <!-- Delegate Pass Summary Card -->
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; margin-bottom: 24px;">
                                                    <tr>
                                                        <td style="padding: 18px;">
                                                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                                <tr>
                                                                    <td style="padding-bottom: 8px; font-size: 12px; color: #92400e; font-weight: bold; text-transform: uppercase;">Delegate Information</td>
                                                                </tr>
                                                                <tr>
                                                                    <td style="font-size: 13px; color: #1e293b; padding: 3px 0;">
                                                                        <strong>Name:</strong> {name}
                                                                    </td>
                                                                </tr>
                                                                {f'<tr><td style="font-size: 13px; color: #1e293b; padding: 3px 0;"><strong>Employee ID:</strong> {employee_id}</td></tr>' if employee_id else ''}
                                                                <tr>
                                                                    <td style="font-size: 13px; color: #1e293b; padding: 3px 0;">
                                                                        <strong>Branch:</strong> {branch_name}
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td style="font-size: 13px; color: #1e293b; padding: 3px 0;">
                                                                        <strong>Pass Attachment:</strong> Official PDF Included
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>

                                                <!-- Download CTA Button -->
                                                <div style="text-align: center; margin: 30px 0;">
                                                    <a href="{download_url}" target="_blank" style="background: linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #d97706 100%); color: #000000; font-weight: bold; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.25);">
                                                        Download / View Official Pass
                                                    </a>
                                                </div>

                                                <!-- Instructions -->
                                                <div style="border-top: 1px dashed #cbd5e1; padding-top: 18px; margin-top: 24px;">
                                                    <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #0f172a; text-transform: uppercase;">Important Event Instructions:</h3>
                                                    <ol style="margin: 0; padding-left: 20px; color: #64748b; font-size: 12px; line-height: 1.6;">
                                                        <li>Please present the unique QR code from your PDF pass at the <strong>Gate Entry Check-in</strong>.</li>
                                                        <li>After gate entry, present the same QR code at the <strong>Gift Counter</strong> to claim your delegate gift.</li>
                                                        <li>The event pass is strictly non-transferable.</li>
                                                    </ol>
                                                </div>
                                            </td>
                                        </tr>

                                        <!-- Footer -->
                                        <tr>
                                            <td align="center" style="background-color: #f8fafc; padding: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
                                                <p style="margin: 0 0 4px 0;">Siri Samruddhi Gold Palace • Yelahanka • Kolar • Udupi</p>
                                                <p style="margin: 0;">© {datetime.now().year} Siri Samruddhi Gold Palace. All rights reserved.</p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                    """

                    body = {
                        "sender": {"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
                        "to": [{"email": email, "name": name}],
                        "subject": f"Your Official Event Pass — GBM Annual Event 2026 ({name})",
                        "htmlContent": html_content
                    }

                    if pdf_b64:
                        body["attachment"] = [
                            {
                                "name": f"SiriSamruddhi_Pass_{name.replace(' ', '_')}.pdf",
                                "content": pdf_b64
                            }
                        ]

                    resp = await client.post(endpoint, json=body, headers=headers)
                    if resp.status_code in (200, 201, 202):
                        status = "SENT"
                        resp_data = resp.json()
                        message_id = resp_data.get("messageId", "")
                    else:
                        status = "FAILED"
                        error_msg = f"Brevo HTTP {resp.status_code}: {resp.text}"
            else:
                # Mock mode
                status = "SENT"
                message_id = f"mock_msg_{uuid.uuid4().hex[:8]}"
                print(f"[DEVELOPMENT EMAIL] Pass sent to {email}: {download_url}")
        except Exception as e:
            status = "FAILED"
            error_msg = str(e)
            print(f"Brevo email error: {e}")

        # Persist log
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO gmb_email_logs (id, registration_id, email, subject, status, message_id, error_message, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (log_id, registration_id, email, "GBM Annual Event 2026 Pass", status, message_id, error_msg, now))
            conn.commit()
            conn.close()
        except Exception as db_e:
            print(f"Database error writing Email log: {db_e}")

        return (status == "SENT"), status
