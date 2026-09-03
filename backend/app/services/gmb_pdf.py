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

        # ── 1. Luxury Royal Purple Canvas ────────────────────────────────────
        c.setFillColor(colors.HexColor("#1A0B2E")) # Deep Royal Purple
        c.rect(0, 0, card_width, card_height, fill=1, stroke=0)

        # Subtle upper header highlight
        c.setFillColor(colors.HexColor("#28114B"))
        c.roundRect(10, card_height - 240, card_width - 20, 230, 16, fill=1, stroke=0)

        # ── 2. Gold & Purple Double Accent Border ────────────────────────────
        c.setStrokeColor(colors.HexColor("#F59E0B")) # Radiant Gold
        c.setLineWidth(2.5)
        c.roundRect(14, 14, card_width - 28, card_height - 28, 16, stroke=1, fill=0)

        c.setStrokeColor(colors.HexColor("#7C3AED")) # Violet-Purple inner border
        c.setLineWidth(1)
        c.roundRect(18, 18, card_width - 36, card_height - 36, 12, stroke=1, fill=0)

        # ── 3. Header Event Badge ────────────────────────────────────────────
        c.setFillColor(colors.HexColor("#3B0764")) # Royal Plum
        c.roundRect(24, card_height - 95, card_width - 48, 70, 12, fill=1, stroke=0)

        c.setStrokeColor(colors.HexColor("#D97706")) # Gold hairline
        c.setLineWidth(1.2)
        c.line(34, card_height - 90, card_width - 34, card_height - 90)

        # Event Headline
        c.setFillColor(colors.HexColor("#FDE047")) # Brilliant Gold
        c.setFont("Helvetica-Bold", 15)
        c.drawCentredString(card_width / 2, card_height - 50, "GBM ANNUAL EVENT 2026")

        c.setFillColor(colors.HexColor("#E9D5FF")) # Soft Lavender
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(card_width / 2, card_height - 70, "OFFICIAL DELEGATE ENTRY & GIFT PASS")

        # ── 4. Attendee Photo Box (Left) ─────────────────────────────────────
        photo_x = 36
        photo_y = card_height - 225
        photo_w = 95
        photo_h = 110

        # Photo container
        c.setFillColor(colors.HexColor("#2E1065"))
        c.roundRect(photo_x, photo_y, photo_w, photo_h, 8, fill=1, stroke=1)
        c.setStrokeColor(colors.HexColor("#F59E0B"))
        c.setLineWidth(1.5)
        c.roundRect(photo_x - 2, photo_y - 2, photo_w + 4, photo_h + 4, 10, stroke=1, fill=0)

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
            c.setFillColor(colors.HexColor("#A855F7"))
            c.setFont("Helvetica-Bold", 10)
            c.drawCentredString(photo_x + photo_w / 2, photo_y + photo_h / 2, "DELEGATE")

        # ── 5. Delegate Details Section (Right) ──────────────────────────────
        info_x = 145
        start_y = card_height - 138

        # Name
        c.setFillColor(colors.HexColor("#FFFFFF"))
        c.setFont("Helvetica-Bold", 14)
        c.drawString(info_x, start_y, name[:24])

        # Designation
        c.setFillColor(colors.HexColor("#DDD6FE"))
        c.setFont("Helvetica", 9.5)
        c.drawString(info_x, start_y - 18, f"Designation: {designation}")

        # Employee ID
        c.setFillColor(colors.HexColor("#FDE047"))
        c.setFont("Helvetica-Bold", 10)
        c.drawString(info_x, start_y - 36, f"Employee ID: {employee_id}")

        # Branch
        c.setFillColor(colors.HexColor("#C084FC"))
        c.setFont("Helvetica-Bold", 9.5)
        c.drawString(info_x, start_y - 54, f"Branch: {branch_name}")

        # Gender & Masked Aadhaar
        c.setFillColor(colors.HexColor("#A78BFA"))
        c.setFont("Helvetica", 8.5)
        gender_str = str(gender).capitalize() if gender else "Delegate"
        c.drawString(info_x, start_y - 70, f"Gender: {gender_str}")
        if masked_aadhaar:
            c.drawString(info_x, start_y - 84, f"Aadhaar: {masked_aadhaar}")

        # ── 6. Decorative Middle Divider ────────────────────────────────────
        c.setStrokeColor(colors.HexColor("#6D28D9"))
        c.setLineWidth(1)
        c.line(30, card_height - 245, card_width - 30, card_height - 245)

        # ── 7. QR Code Section (Pure White Badge with Purple Accents) ────────
        qr_size = 155
        qr_x = (card_width - qr_size) / 2
        qr_y = card_height - 430

        # White Container
        c.setFillColor(colors.HexColor("#FFFFFF"))
        c.roundRect(qr_x - 12, qr_y - 12, qr_size + 24, qr_size + 24, 14, fill=1, stroke=0)
        c.setStrokeColor(colors.HexColor("#7C3AED"))
        c.setLineWidth(1.5)
        c.roundRect(qr_x - 12, qr_y - 12, qr_size + 24, qr_size + 24, 14, stroke=1, fill=0)

        # Draw QR Image
        if os.path.exists(qr_img_path):
            c.drawImage(qr_img_path, qr_x, qr_y, width=qr_size, height=qr_size)

        # Monospace Pass Token
        c.setFillColor(colors.HexColor("#FDE047"))
        c.setFont("Courier-Bold", 12)
        c.drawCentredString(card_width / 2, qr_y - 28, qr_token)

        # ── 8. Footer Instructions ───────────────────────────────────────────
        c.setFillColor(colors.HexColor("#28114B"))
        c.roundRect(26, 26, card_width - 52, 60, 10, fill=1, stroke=0)

        c.setFillColor(colors.HexColor("#F59E0B"))
        c.setFont("Helvetica-Bold", 8.5)
        c.drawCentredString(card_width / 2, 70, "CHECK-IN & GIFT REDEMPTION INSTRUCTIONS")

        c.setFillColor(colors.HexColor("#E9D5FF"))
        c.setFont("Helvetica", 7.5)
        c.drawCentredString(card_width / 2, 54, "1. Present this QR code at Gate Check-In for entry verification.")
        c.drawCentredString(card_width / 2, 42, "2. Present this QR at the Gift Counter to redeem your official delegate gift.")
        c.drawCentredString(card_width / 2, 32, "Strictly non-transferable. Valid for GBM Event 2026.")

        c.save()
        return str(pdf_path)
