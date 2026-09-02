import sqlite3
import json
import os
import hashlib
from pathlib import Path
from datetime import datetime

# Database file location in backend directory
DB_PATH = Path(__file__).resolve().parents[2] / "sirisamruddhi_crm.db"

def get_db_connection():
    conn = sqlite3.connect(str(DB_PATH), timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Enable WAL mode and busy timeout for high concurrency
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("PRAGMA busy_timeout=15000")
    return conn

def get_setting(key: str, default: dict = None) -> dict:
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT data FROM settings WHERE key = ?", (key,))
        row = cursor.fetchone()
        conn.close()
        if row and row["data"]:
            return json.loads(row["data"])
    except Exception as e:
        print(f"Error fetching setting {key}: {e}")
    return default or {}

def set_setting(key: str, data: dict) -> None:
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT OR REPLACE INTO settings (key, data)
        VALUES (?, ?)
        """, (key, json.dumps(data)))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error setting {key}: {e}")

def hash_password(password: str) -> str:
    """Standard SHA256 password hash for staff authentication"""
    salt = "ssgp_gmb_salt_2026"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. CRM Leads Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT DEFAULT '',
        source TEXT DEFAULT 'Walk-in',
        status TEXT DEFAULT 'New Lead',
        interestedIn TEXT DEFAULT 'Gold Jewelry',
        notes TEXT DEFAULT '',
        scheduledCall TEXT DEFAULT '',
        createdAt TEXT,
        callLogs TEXT DEFAULT '[]'
    )
    """)

    # 2. CRM Clients Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT DEFAULT '',
        totalPurchases REAL DEFAULT 0.0,
        status TEXT DEFAULT 'Won',
        createdAt TEXT
    )
    """)

    # 3. CRM Tasks Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        dueDate TEXT,
        status TEXT DEFAULT 'Pending',
        assignedTo TEXT DEFAULT 'siriadmin',
        leadId TEXT DEFAULT '',
        createdAt TEXT
    )
    """)

    # 4. Settings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        data TEXT
    )
    """)

    # 5. Messages Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        sender TEXT DEFAULT '',
        recipient TEXT DEFAULT '',
        body TEXT DEFAULT '',
        timestamp TEXT,
        channel TEXT DEFAULT 'WhatsApp',
        platform_id TEXT DEFAULT '',
        status TEXT DEFAULT 'sent'
    )
    """)

    # 6. CRM Email Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS email_logs (
        id TEXT PRIMARY KEY,
        to_email TEXT,
        subject TEXT,
        timestamp TEXT,
        status TEXT,
        messageId TEXT,
        error TEXT,
        body TEXT
    )
    """)

    # 7. WhatsApp Templates Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS whatsapp_templates (
        id TEXT PRIMARY KEY,
        name TEXT,
        category TEXT,
        language TEXT,
        body TEXT,
        status TEXT,
        variables TEXT
    )
    """)

    # ═══════════════════════════════════════════════════════════════════════════
    # GMB EVENT MANAGEMENT TABLES
    # ═══════════════════════════════════════════════════════════════════════════

    # 8. GMB Companies
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gmb_companies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        is_active INTEGER DEFAULT 1,
        created_at TEXT
    )
    """)

    # 9. GMB Branches
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gmb_branches (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        city TEXT DEFAULT '',
        is_active INTEGER DEFAULT 1,
        created_at TEXT,
        FOREIGN KEY (company_id) REFERENCES gmb_companies (id)
    )
    """)

    # 10. GMB Events
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gmb_events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        event_date TEXT NOT NULL,
        venue TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT
    )
    """)

    # 11. GMB Gift Types (Male / Female configured items)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gmb_gift_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        gender TEXT NOT NULL, -- 'male', 'female', 'any'
        description TEXT DEFAULT '',
        is_active INTEGER DEFAULT 1,
        created_at TEXT
    )
    """)

    # 12. GMB Staff Users (RBAC: ADMIN, GATE_STAFF, GIFT_STAFF)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gmb_staff_users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL, -- 'ADMIN', 'GATE_STAFF', 'GIFT_STAFF'
        branch_id TEXT DEFAULT '',
        is_active INTEGER DEFAULT 1,
        created_at TEXT
    )
    """)

    # 13. GMB OTP Challenges (Digintra SMS OTP challenge state)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gmb_otp_challenges (
        id TEXT PRIMARY KEY,
        mobile TEXT NOT NULL,
        hashed_otp TEXT NOT NULL,
        session_token TEXT NOT NULL UNIQUE,
        attempts INTEGER DEFAULT 0,
        is_verified INTEGER DEFAULT 0,
        expires_at TEXT NOT NULL,
        created_at TEXT
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_gmb_otp_mobile ON gmb_otp_challenges(mobile)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_gmb_otp_token ON gmb_otp_challenges(session_token)")

    # 14. GMB Registrations (Main Attendee Table with constraints)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gmb_registrations (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        company_id TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        name TEXT NOT NULL,
        designation TEXT NOT NULL,
        mobile TEXT NOT NULL,
        email TEXT DEFAULT '',
        aadhaar_masked TEXT NOT NULL,
        aadhaar_hash TEXT NOT NULL,
        employee_id TEXT NOT NULL,
        gender TEXT NOT NULL, -- 'male', 'female'
        photo_url TEXT NOT NULL,
        registration_status TEXT DEFAULT 'CONFIRMED',
        entry_status TEXT DEFAULT 'NOT_ENTERED', -- 'NOT_ENTERED', 'ENTERED'
        gift_status TEXT DEFAULT 'PENDING', -- 'PENDING', 'CLAIMED'
        created_at TEXT,
        FOREIGN KEY (event_id) REFERENCES gmb_events (id),
        FOREIGN KEY (company_id) REFERENCES gmb_companies (id),
        FOREIGN KEY (branch_id) REFERENCES gmb_branches (id),
        UNIQUE(event_id, mobile),
        UNIQUE(event_id, employee_id)
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_gmb_reg_event ON gmb_registrations(event_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_gmb_reg_mobile ON gmb_registrations(mobile)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_gmb_reg_emp ON gmb_registrations(employee_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_gmb_reg_branch ON gmb_registrations(branch_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_gmb_reg_entry ON gmb_registrations(entry_status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_gmb_reg_gift ON gmb_registrations(gift_status)")

    # 15. GMB Event Passes (Unique QR & PDF Pass)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gmb_event_passes (
        id TEXT PRIMARY KEY,
        registration_id TEXT NOT NULL UNIQUE,
        qr_token TEXT NOT NULL UNIQUE,
        pdf_path TEXT NOT NULL,
        download_token TEXT NOT NULL UNIQUE,
        is_active INTEGER DEFAULT 1,
        created_at TEXT,
        FOREIGN KEY (registration_id) REFERENCES gmb_registrations (id)
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_gmb_pass_qr ON gmb_event_passes(qr_token)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_gmb_pass_download ON gmb_event_passes(download_token)")

    # 16. GMB Entry Scans (Gate Scan Log)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gmb_entry_scans (
        id TEXT PRIMARY KEY,
        pass_id TEXT NOT NULL,
        registration_id TEXT NOT NULL,
        staff_id TEXT NOT NULL,
        staff_name TEXT DEFAULT '',
        gate_name TEXT DEFAULT 'Main Gate',
        entry_status TEXT NOT NULL, -- 'SUCCESS', 'DUPLICATE_REJECTED', 'UNAUTHORIZED'
        device_info TEXT DEFAULT '',
        scanned_at TEXT,
        FOREIGN KEY (pass_id) REFERENCES gmb_event_passes (id),
        FOREIGN KEY (registration_id) REFERENCES gmb_registrations (id)
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_gmb_entry_reg ON gmb_entry_scans(registration_id)")

    # 17. GMB Gift Redemptions (Gift Log)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gmb_gift_redemptions (
        id TEXT PRIMARY KEY,
        pass_id TEXT NOT NULL,
        registration_id TEXT NOT NULL,
        gift_type_id TEXT NOT NULL,
        gift_name TEXT NOT NULL,
        staff_id TEXT NOT NULL,
        staff_name TEXT DEFAULT '',
        counter_name TEXT DEFAULT 'Gift Counter 1',
        status TEXT NOT NULL, -- 'CLAIMED', 'REJECTED_ALREADY_CLAIMED', 'REJECTED_NOT_ENTERED'
        redeemed_at TEXT,
        FOREIGN KEY (pass_id) REFERENCES gmb_event_passes (id),
        FOREIGN KEY (registration_id) REFERENCES gmb_registrations (id),
        FOREIGN KEY (gift_type_id) REFERENCES gmb_gift_types (id)
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_gmb_gift_reg ON gmb_gift_redemptions(registration_id)")

    # 18. GMB Audit & Scan Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gmb_scan_logs (
        id TEXT PRIMARY KEY,
        pass_id TEXT DEFAULT '',
        registration_id TEXT DEFAULT '',
        action TEXT NOT NULL, -- 'QR_SCANNED', 'ENTRY_CONFIRMED', 'ENTRY_ALREADY_COMPLETED', 'GIFT_CLAIMED', 'GIFT_ALREADY_CLAIMED', 'GIFT_LOCKED', 'INVALID_QR'
        result TEXT NOT NULL, -- 'SUCCESS', 'WARNING', 'REJECTED', 'ERROR'
        staff_id TEXT DEFAULT '',
        staff_name TEXT DEFAULT '',
        scanner_type TEXT DEFAULT 'GATE', -- 'GATE', 'GIFT', 'PUBLIC'
        counter_gate TEXT DEFAULT '',
        reason TEXT DEFAULT '',
        created_at TEXT
    )
    """)

    # 19. GMB WhatsApp Logs (AiSensy)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gmb_whatsapp_logs (
        id TEXT PRIMARY KEY,
        registration_id TEXT NOT NULL,
        mobile TEXT NOT NULL,
        template_name TEXT DEFAULT '',
        status TEXT NOT NULL, -- 'PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'
        error_message TEXT DEFAULT '',
        response_payload TEXT DEFAULT '',
        created_at TEXT,
        FOREIGN KEY (registration_id) REFERENCES gmb_registrations (id)
    )
    """)

    # 20. GMB Email Logs (Brevo)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gmb_email_logs (
        id TEXT PRIMARY KEY,
        registration_id TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT DEFAULT '',
        status TEXT NOT NULL, -- 'PENDING', 'SENT', 'FAILED'
        message_id TEXT DEFAULT '',
        error_message TEXT DEFAULT '',
        created_at TEXT,
        FOREIGN KEY (registration_id) REFERENCES gmb_registrations (id)
    )
    """)

    # ═══════════════════════════════════════════════════════════════════════════
    # SEED DATA
    # ═══════════════════════════════════════════════════════════════════════════

    now = datetime.now().isoformat() + "Z"

    # Seed Company: Siri Samruddhi Gold Palace
    cursor.execute("SELECT id FROM gmb_companies WHERE code = 'SSGP'")
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO gmb_companies (id, name, code, is_active, created_at)
        VALUES ('comp_ssgp', 'Siri Samruddhi Gold Palace', 'SSGP', 1, ?)
        """, (now,))

    # Seed Branches: Yelahanka, Kolar, Udupi
    branches = [
        ('branch_yelahanka', 'comp_ssgp', 'Yelahanka', 'YEL', 'Bengaluru'),
        ('branch_kolar', 'comp_ssgp', 'Kolar', 'KOL', 'Kolar'),
        ('branch_udupi', 'comp_ssgp', 'Udupi', 'UDU', 'Udupi'),
    ]
    for b_id, c_id, name, code, city in branches:
        cursor.execute("SELECT id FROM gmb_branches WHERE id = ?", (b_id,))
        if not cursor.fetchone():
            cursor.execute("""
            INSERT INTO gmb_branches (id, company_id, name, code, city, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, 1, ?)
            """, (b_id, c_id, name, code, city, now))

    # Seed Active Event: GBM Annual Event 2026
    cursor.execute("SELECT id FROM gmb_events WHERE code = 'GBM2026'")
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO gmb_events (id, title, code, event_date, venue, is_active, created_at)
        VALUES ('evt_gbm2026', 'GBM Annual Event 2026', 'GBM2026', '2026-09-02', 'Siri Samruddhi Grand Convention Center', 1, ?)
        """, (now,))

    # Seed Gift Types (Male & Female)
    gift_types = [
        ('gift_male', 'Executive Prestige Gift Set', 'male', 'Premium gold-embossed executive watch & pen set'),
        ('gift_female', 'Pure Silk Saree & Jewelry Box', 'female', 'Traditional handloom pure silk saree with luxury velvet jewelry box'),
    ]
    for g_id, g_name, g_gender, g_desc in gift_types:
        cursor.execute("SELECT id FROM gmb_gift_types WHERE id = ?", (g_id,))
        if not cursor.fetchone():
            cursor.execute("""
            INSERT INTO gmb_gift_types (id, name, gender, description, is_active, created_at)
            VALUES (?, ?, ?, ?, 1, ?)
            """, (g_id, g_name, g_gender, g_desc, now))

    # Seed Default Staff Users (Admin, Gate Staff, Gift Staff)
    # Admin: siriadmin / siriadmin1234
    # Gate Staff: gate_staff1 / gate1234
    # Gift Staff: gift_staff1 / gift1234
    default_staff = [
        ('staff_admin', 'siriadmin', hash_password('siriadmin1234'), 'GBM Chief Admin', 'ADMIN', ''),
        ('staff_env_user', 'staff', hash_password('staff1234'), 'Authorized Event Staff', 'ADMIN', ''),
        ('staff_gate1', 'gate_staff1', hash_password('gate1234'), 'Ramesh Kumar (Gate 1)', 'GATE_STAFF', 'branch_yelahanka'),
        ('staff_gift1', 'gift_staff1', hash_password('gift1234'), 'Priya Sharma (Counter 1)', 'GIFT_STAFF', 'branch_yelahanka'),
    ]
    for s_id, s_user, s_pass, s_name, s_role, s_branch in default_staff:
        cursor.execute("SELECT id FROM gmb_staff_users WHERE username = ?", (s_user,))
        if not cursor.fetchone():
            cursor.execute("""
            INSERT INTO gmb_staff_users (id, username, password_hash, full_name, role, branch_id, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?)
            """, (s_id, s_user, s_pass, s_name, s_role, s_branch, now))

    # Seed the requested VIP lead with phone +91 7996633015 if not already present
    cursor.execute("SELECT id FROM leads WHERE phone = '+91 7996633015' OR phone = '+917996633015'")
    existing = cursor.fetchone()
    if not existing:
        cursor.execute("""
        INSERT INTO leads (id, name, phone, email, source, status, interestedIn, notes, scheduledCall, createdAt, callLogs)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "lead_79966330",
            "Siri Samruddhi VIP Prospect",
            "+91 7996633015",
            "vip.client@sirisamruddhigold.com",
            "Website Inquiry",
            "New Lead",
            "Gold Jewelry",
            "Inquired about antique gold necklace for upcoming family wedding & 100% free making charges offer. Ready for AI Voice Agent call.",
            "",
            now,
            json.dumps([])
        ))

    conn.commit()
    conn.close()

# Initialize tables on import
init_db()
