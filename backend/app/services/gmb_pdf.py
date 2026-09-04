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

        # High contrast purple-black QR on crisp white
        img = qr.make_image(fill_color="#2E1065", back_color="#FFFFFF").convert("RGB")
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
        masked_aadhaar: str = "",
        gender: str = "male",
        photo_filename: str = "",
        public_base_url: str = "http://localhost:5173"
    ) -> str:
        """
        Generates a luxury royal purple & gold personalized VIP PDF pass for the attendee.
        Returns: Path to generated PDF file.
        """
        pdf_path = PASSES_DIR / f"pass_{qr_token}.pdf"
        qr_img_path = GmbPdfService.generate_qr_code(qr_token, public_base_url)

        # Page Dimensions: Standard VIP Card (420 x 595 pt, portrait)
        card_width = 420
        card_height = 595

        c = canvas.Canvas(str(pdf_path), pagesize=(card_width, card_height))

        # ── 1. Clean Crisp Light Canvas & Pearl Card ────────────────────────
        c.setFillColor(colors.HexColor("#FAFAFD")) # Ultra Light Pearl Background
        c.rect(0, 0, card_width, card_height, fill=1, stroke=0)

        # Inner Card
        c.setFillColor(colors.HexColor("#FFFFFF")) # Crisp White Inner Card
        c.roundRect(12, 12, card_width - 24, card_height - 24, 16, fill=1, stroke=0)

        # ── 2. Subtle Luxury Dual Border ─────────────────────────────────────
        c.setStrokeColor(colors.HexColor("#D8B4FE")) # Soft Purple Outer Border
        c.setLineWidth(2)
        c.roundRect(14, 14, card_width - 28, card_height - 28, 14, stroke=1, fill=0)

        c.setStrokeColor(colors.HexColor("#ECCFC0")) # Soft Orange/Bronze Accent Inner Border
        c.setLineWidth(0.8)
        c.roundRect(18, 18, card_width - 36, card_height - 36, 12, stroke=1, fill=0)

        # ── 3. Header Event Badge (Light Purple with Deep Purple & Green) ───
        c.setFillColor(colors.HexColor("#F3E8FF")) # Light Purple Header BG
        c.roundRect(24, card_height - 96, card_width - 48, 72, 12, fill=1, stroke=0)
        c.setStrokeColor(colors.HexColor("#D8B4FE"))
        c.setLineWidth(1.2)
        c.roundRect(24, card_height - 96, card_width - 48, 72, 12, stroke=1, fill=0)

        # Event Headline
        c.setFillColor(colors.HexColor("#3B0764")) # Royal Dark Purple
        c.setFont("Helvetica-Bold", 14.5)
        c.drawCentredString(card_width / 2, card_height - 52, "GBM ANNUAL EVENT 2026")

        c.setFillColor(colors.HexColor("#21845F")) # Vibrant Green Subtitle
        c.setFont("Helvetica-Bold", 8.5)
        c.drawCentredString(card_width / 2, card_height - 72, "OFFICIAL DELEGATE ENTRY & GIFT PASS")

        # ── 4. Attendee Photo Box (Left) ─────────────────────────────────────
        photo_x = 36
        photo_y = card_height - 228
        photo_w = 95
        photo_h = 110

        # Photo container
        c.setFillColor(colors.HexColor("#F8FAFC"))
        c.roundRect(photo_x, photo_y, photo_w, photo_h, 10, fill=1, stroke=0)
        c.setStrokeColor(colors.HexColor("#D8B4FE"))
        c.setLineWidth(1.5)
        c.roundRect(photo_x, photo_y, photo_w, photo_h, 10, stroke=1, fill=0)

        photo_drawn = False
        if photo_filename:
            raw_photo_path = PHOTOS_DIR / os.path.basename(photo_filename)
            if raw_photo_path.exists():
                try:
                    c.drawImage(str(raw_photo_path), photo_x + 2, photo_y + 2, width=photo_w - 4, height=photo_h - 4, preserveAspectRatio=True)
                    photo_drawn = True
                except Exception as e:
                    print(f"Error drawing attendee photo: {e}")

        if not photo_drawn:
            c.setFillColor(colors.HexColor("#7E22CE"))
            c.setFont("Helvetica-Bold", 10)
            c.drawCentredString(photo_x + photo_w / 2, photo_y + photo_h / 2, "DELEGATE")

        # ── 5. Delegate Details Section (Right) ──────────────────────────────
        info_x = 145
        start_y = card_height - 140

        # Name (Dark Bold)
        c.setFillColor(colors.HexColor("#0F172A")) # Slate-900
        c.setFont("Helvetica-Bold", 14)
        c.drawString(info_x, start_y, name[:24])

        # Designation
        c.setFillColor(colors.HexColor("#526F91")) # Brand Blue
        c.setFont("Helvetica", 9.5)
        c.drawString(info_x, start_y - 18, f"Designation: {designation}")

        # Employee ID (Purple Pill Accent)
        c.setFillColor(colors.HexColor("#7E22CE")) # Main Purple
        c.setFont("Helvetica-Bold", 10)
        c.drawString(info_x, start_y - 36, f"Employee ID: {employee_id}")

        # Branch
        c.setFillColor(colors.HexColor("#21845F")) # Brand Green
        c.setFont("Helvetica-Bold", 9.5)
        c.drawString(info_x, start_y - 54, f"Branch: {branch_name}")

        # Gender & Masked Aadhaar
        c.setFillColor(colors.HexColor("#64748B")) # Muted Slate
        c.setFont("Helvetica", 8.5)
        gender_str = str(gender).capitalize() if gender else "Delegate"
        c.drawString(info_x, start_y - 70, f"Gender: {gender_str}")
        if masked_aadhaar:
            c.drawString(info_x, start_y - 84, f"Aadhaar: {masked_aadhaar}")

        # ── 6. Decorative Middle Divider ────────────────────────────────────
        c.setStrokeColor(colors.HexColor("#E2E8F0"))
        c.setLineWidth(1)
        c.line(30, card_height - 248, card_width - 30, card_height - 248)

        # ── 7. QR Code Section (Pure White Badge with Purple Accents) ────────
        qr_size = 150
        qr_x = (card_width - qr_size) / 2
        qr_y = card_height - 425

        # White Container with soft border
        c.setFillColor(colors.HexColor("#FFFFFF"))
        c.roundRect(qr_x - 12, qr_y - 12, qr_size + 24, qr_size + 24, 14, fill=1, stroke=0)
        c.setStrokeColor(colors.HexColor("#D8B4FE"))
        c.setLineWidth(1.5)
        c.roundRect(qr_x - 12, qr_y - 12, qr_size + 24, qr_size + 24, 14, stroke=1, fill=0)

        # Draw QR Image
        if os.path.exists(qr_img_path):
            c.drawImage(qr_img_path, qr_x, qr_y, width=qr_size, height=qr_size)

        # Monospace Pass Token (Purple)
        c.setFillColor(colors.HexColor("#7E22CE"))
        c.setFont("Courier-Bold", 12)
        c.drawCentredString(card_width / 2, qr_y - 28, qr_token)

        # ── 8. Footer Instructions (Light Gray/Blue Container) ───────────────
        c.setFillColor(colors.HexColor("#EDF2F8")) # Light Blue BG
        c.roundRect(26, 26, card_width - 52, 60, 10, fill=1, stroke=0)
        c.setStrokeColor(colors.HexColor("#C6D4E3"))
        c.setLineWidth(0.8)
        c.roundRect(26, 26, card_width - 52, 60, 10, stroke=1, fill=0)

        c.setFillColor(colors.HexColor("#1E3A8A")) # Dark Blue
        c.setFont("Helvetica-Bold", 8.5)
        c.drawCentredString(card_width / 2, 70, "CHECK-IN & GIFT REDEMPTION INSTRUCTIONS")

        c.setFillColor(colors.HexColor("#526F91")) # Slate Blue
        c.setFont("Helvetica", 7.5)
        c.drawCentredString(card_width / 2, 54, "1. Present this QR code at Gate Check-In for entry verification.")
        c.drawCentredString(card_width / 2, 42, "2. Present this QR at the Gift Counter to redeem your official delegate gift.")
        c.drawCentredString(card_width / 2, 32, "Strictly non-transferable. Valid for GBM Event 2026.")

        c.save()
        return str(pdf_path)
