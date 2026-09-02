import os
import io
import qrcode
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import inch

UPLOADS_DIR = Path(__file__).resolve().parents[2] / "uploads"
PASSES_DIR = UPLOADS_DIR / "passes"
QR_DIR = UPLOADS_DIR / "qrcodes"
PHOTOS_DIR = UPLOADS_DIR / "photos"

PASSES_DIR.mkdir(parents=True, exist_ok=True)
QR_DIR.mkdir(parents=True, exist_ok=True)
PHOTOS_DIR.mkdir(parents=True, exist_ok=True)

class GmbPdfService:
    @staticmethod
    def generate_qr_code(token: str, public_base_url: str) -> str:
        """
        Generates a high-res QR code image with the verification URL.
        Returns: filepath to saved QR PNG
        """
        qr_url = f"{public_base_url.rstrip('/')}/gbm/pass/{token}"
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=2,
        )
        qr.add_data(qr_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="#1E293B", back_color="#FFFFFF").convert("RGB")
        qr_path = QR_DIR / f"qr_{token}.png"
        img.save(str(qr_path))
        return str(qr_path)

    @staticmethod
    def generate_event_pass_pdf(
        qr_token: str,
        name: str,
        designation: str,
        employee_id: str,
        branch_name: str,
        company_name: str,
        masked_aadhaar: str,
        gender: str,
        photo_filename: str,
        public_base_url: str
    ) -> str:
        """
        Generates a personalized, print-friendly luxury PDF pass for the attendee.
        Returns: Path to generated PDF file.
        """
        pdf_path = PASSES_DIR / f"pass_{qr_token}.pdf"
        qr_img_path = GmbPdfService.generate_qr_code(qr_token, public_base_url)

        # Page Dimensions: A5 or standard card in Letter size (420 x 595 pt, portrait card)
        card_width = 420
        card_height = 595

        c = canvas.Canvas(str(pdf_path), pagesize=(card_width, card_height))

        # ── Background Gradient / Dark Theme ─────────────────────────────────
        c.setFillColor(colors.HexColor("#0F172A")) # Deep Slate 900
        c.rect(0, 0, card_width, card_height, fill=1, stroke=0)

        # ── Gold Accent Border ───────────────────────────────────────────────
        c.setStrokeColor(colors.HexColor("#F59E0B")) # Amber Gold
        c.setLineWidth(2.5)
        c.roundRect(14, 14, card_width - 28, card_height - 28, 16, stroke=1, fill=0)

        c.setStrokeColor(colors.HexColor("#FDE68A")) # Pale Gold inner border
        c.setLineWidth(0.75)
        c.roundRect(18, 18, card_width - 36, card_height - 36, 12, stroke=1, fill=0)

        # ── Header Banner ────────────────────────────────────────────────────
        c.setFillColor(colors.HexColor("#1E293B")) # Slate 800
        c.roundRect(24, card_height - 110, card_width - 48, 80, 10, fill=1, stroke=0)

        # Header Gold Line
        c.setStrokeColor(colors.HexColor("#D97706"))
        c.setLineWidth(1.5)
        c.line(34, card_height - 105, card_width - 34, card_height - 105)

        # Company Name
        c.setFillColor(colors.HexColor("#F59E0B"))
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(card_width / 2, card_height - 54, company_name.upper())

        # Subtitle / Event Name
        c.setFillColor(colors.HexColor("#FFFFFF"))
        c.setFont("Helvetica-Bold", 12)
        c.drawCentredString(card_width / 2, card_height - 74, "GBM ANNUAL EVENT 2026")

        c.setFillColor(colors.HexColor("#94A3B8"))
        c.setFont("Helvetica", 9)
        c.drawCentredString(card_width / 2, card_height - 92, "OFFICIAL ENTRY & GIFT DELEGATE PASS")

        # ── Customer Photo & Details Section ─────────────────────────────────
        # Photo box on the left or centered
        photo_x = 40
        photo_y = card_height - 235
        photo_w = 95
        photo_h = 105

        # Photo border
        c.setFillColor(colors.HexColor("#1E293B"))
        c.roundRect(photo_x, photo_y, photo_w, photo_h, 8, fill=1, stroke=1)
        c.setStrokeColor(colors.HexColor("#F59E0B"))
        c.setLineWidth(1.5)
        c.roundRect(photo_x - 2, photo_y - 2, photo_w + 4, photo_h + 4, 10, stroke=1, fill=0)

        # Draw Photo if available
        photo_drawn = False
        if photo_filename:
            raw_photo_path = PHOTOS_DIR / os.path.basename(photo_filename)
            if raw_photo_path.exists():
                try:
                    c.drawImage(str(raw_photo_path), photo_x, photo_y, width=photo_w, height=photo_h, preserveAspectRatio=True)
                    photo_drawn = True
                except Exception as e:
                    print(f"Error drawing attendee photo: {e}")

        if not photo_drawn:
            c.setFillColor(colors.HexColor("#64748B"))
            c.setFont("Helvetica-Bold", 10)
            c.drawCentredString(photo_x + photo_w / 2, photo_y + photo_h / 2, "PHOTO")

        # ── Delegate Information (Right of Photo) ────────────────────────────
        info_x = 155
        start_y = card_height - 145

        # Name
        c.setFillColor(colors.HexColor("#FBBF24"))
        c.setFont("Helvetica-Bold", 14)
        c.drawString(info_x, start_y, name[:24])

        # Designation
        c.setFillColor(colors.HexColor("#E2E8F0"))
        c.setFont("Helvetica", 10)
        c.drawString(info_x, start_y - 18, f"Designation: {designation}")

        # Employee ID
        c.setFillColor(colors.HexColor("#CBD5E1"))
        c.setFont("Helvetica-Bold", 10)
        c.drawString(info_x, start_y - 36, f"Employee ID: {employee_id}")

        # Branch
        c.setFillColor(colors.HexColor("#F59E0B"))
        c.setFont("Helvetica-Bold", 10)
        c.drawString(info_x, start_y - 54, f"Branch: {branch_name}")

        # Gender & Masked Aadhaar
        c.setFillColor(colors.HexColor("#94A3B8"))
        c.setFont("Helvetica", 9)
        c.drawString(info_x, start_y - 72, f"Gender: {gender.capitalize()}")
        c.drawString(info_x, start_y - 88, f"Aadhaar: {masked_aadhaar}")

        # ── Middle Divider with Security Ribbon ──────────────────────────────
        c.setStrokeColor(colors.HexColor("#334155"))
        c.setLineWidth(1)
        c.line(30, card_height - 252, card_width - 30, card_height - 252)

        # ── QR Code Section (Centered & Clear) ───────────────────────────────
        qr_size = 150
        qr_x = (card_width - qr_size) / 2
        qr_y = card_height - 435

        # White background for QR code scanning reliability
        c.setFillColor(colors.HexColor("#FFFFFF"))
        c.roundRect(qr_x - 10, qr_y - 10, qr_size + 20, qr_size + 20, 10, fill=1, stroke=0)

        # Draw QR Image
        if os.path.exists(qr_img_path):
            c.drawImage(qr_img_path, qr_x, qr_y, width=qr_size, height=qr_size)

        # Pass Token underneath QR
        c.setFillColor(colors.HexColor("#F59E0B"))
        c.setFont("Courier-Bold", 11)
        c.drawCentredString(card_width / 2, qr_y - 24, qr_token)

        # ── Instructions & Footer ────────────────────────────────────────────
        c.setFillColor(colors.HexColor("#E2E8F0"))
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(card_width / 2, 70, "ENTRY & GIFT REDEMPTION INSTRUCTIONS")

        c.setFillColor(colors.HexColor("#94A3B8"))
        c.setFont("Helvetica", 8)
        c.drawCentredString(card_width / 2, 54, "1. Present this QR code at Gate Entry to check-in.")
        c.drawCentredString(card_width / 2, 42, "2. Present this QR at Gift Counter to claim your delegate gift.")
        c.drawCentredString(card_width / 2, 30, "Strictly non-transferable. One pass valid per delegate.")

        c.save()
        return str(pdf_path)
