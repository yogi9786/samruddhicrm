import sqlite3
import json
import os
import hashlib
from pathlib import Path
from datetime import datetime
# Multi-path environment loader ensuring .env is found in all execution contexts
def _ensure_env_loaded():
    _env_candidates = [
        Path(__file__).resolve().parents[2] / ".env",
        Path(__file__).resolve().parents[1] / ".env",
        Path("/var/www/samruddhicrm/backend/.env"),
        Path("/var/www/samruddhicrm/.env"),
        Path.cwd() / ".env",
        Path.cwd() / "backend" / ".env"
    ]
    for p in _env_candidates:
        if p.exists():
            load_dotenv(dotenv_path=p, override=True)
            break
    else:
        load_dotenv(override=True)

_ensure_env_loaded()

# Database file location in backend directory
DB_PATH = Path(__file__).resolve().parents[2] / "sirisamruddhi_crm.db"

class PgRow(dict):
    """Row adapter for PostgreSQL RealDictCursor allowing dictionary and index-based access matching sqlite3.Row"""
    def __getitem__(self, key):
        if isinstance(key, int):
            return list(self.values())[key]
        return super().__getitem__(key)

    def __contains__(self, key):
        return super().__contains__(key)

class PgCursorWrapper:
    """Cursor wrapper that translates SQLite '?' parameter syntax and statements to PostgreSQL '%s' syntax"""
    def __init__(self, pg_cursor):
        self._cur = pg_cursor

    def _convert_query(self, query: str) -> str:
        q = query
        # Handle SQLite specific upsert syntax if encountered
        if "INSERT OR REPLACE INTO settings" in q:
            q = q.replace("INSERT OR REPLACE INTO settings", "INSERT INTO settings")
            if "ON CONFLICT" not in q:
                q += " ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data"
        elif "INSERT OR IGNORE INTO" in q:
            q = q.replace("INSERT OR IGNORE INTO", "INSERT INTO")
            if "ON CONFLICT" not in q:
                q += " ON CONFLICT DO NOTHING"

        # Safely convert '?' to '%s' outside quotes
        parts = []
        in_quote = False
        quote_char = None
        for char in q:
            if char in ("'", '"'):
                if not in_quote:
                    in_quote = True
                    quote_char = char
                elif quote_char == char:
                    in_quote = False
                    quote_char = None
                parts.append(char)
            elif char == '?' and not in_quote:
                parts.append('%s')
            else:
                parts.append(char)
        return "".join(parts)

    def execute(self, query, params=None):
        converted = self._convert_query(query)
        if params is not None:
            if isinstance(params, (list, tuple)):
                return self._cur.execute(converted, tuple(params))
            return self._cur.execute(converted, params)
        return self._cur.execute(converted)

    def executemany(self, query, params_list):
        converted = self._convert_query(query)
        return self._cur.executemany(converted, params_list)

    def fetchone(self):
        row = self._cur.fetchone()
        return PgRow(row) if row else None

    def fetchall(self):
        rows = self._cur.fetchall()
        return [PgRow(r) for r in rows] if rows else []

    @property
    def rowcount(self):
        return self._cur.rowcount

    @property
    def lastrowid(self):
        return getattr(self._cur, 'lastrowid', None)

    def close(self):
        return self._cur.close()

class PgConnectionWrapper:
    """Connection wrapper ensuring full parity with sqlite3 Connection"""
    def __init__(self, pg_conn):
        self._conn = pg_conn

    def cursor(self):
        return PgCursorWrapper(self._conn.cursor())

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        return self._conn.close()

    def execute(self, query, params=None):
        cur = self.cursor()
        cur.execute(query, params)
        return cur


def get_postgres_connection():
    """Attempts to connect to PostgreSQL using DATABASE_URL or individual POSTGRES_* params"""
    _ensure_env_loaded()
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        
        db_url = os.getenv("DATABASE_URL")
        if db_url:
            conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
        else:
            host = os.getenv("POSTGRES_HOST", "127.0.0.1")
            port = int(os.getenv("POSTGRES_PORT", 5432))
            dbname = os.getenv("POSTGRES_DB", "sirisamruddhi_crm")
            user = os.getenv("POSTGRES_USER", "sirisamruddhi_admin")
            password = os.getenv("POSTGRES_PASSWORD", "SiriGold@Secure2026!$#AdminDb")
            conn = psycopg2.connect(
                host=host,
                port=port,
                dbname=dbname,
                user=user,
                password=password,
                cursor_factory=RealDictCursor
            )
        return conn
    except Exception as e:
        print(f"[!] PostgreSQL connection notice: {e}")
        return None

def auto_migrate_databases():
    """
    Automatic Schema Migration & Auto-Sync Engine:
    1. Initializes and verifies all tables and columns in SQLite.
    2. If PostgreSQL is reachable, automatically creates any missing tables,
       adds any new columns without data loss, and replicates new records.
    """
    try:
        init_db()
    except Exception as e:
        print(f"[!] SQLite init warning: {e}")

    # Auto-migrate PostgreSQL if available
    pg_conn = get_postgres_connection()
    if pg_conn:
        try:
            sql_file = Path(__file__).resolve().parents[2] / "postgres_setup_and_schema.sql"
            if sql_file.exists():
                with open(sql_file, "r", encoding="utf-8") as f:
                    content = f.read()
                cur = pg_conn.cursor()
                cur.execute(content)
                pg_conn.commit()
                print("[+] Auto-Migrator: PostgreSQL database verified & synchronized successfully.")
            pg_conn.close()
        except Exception as pge:
            print(f"[*] Auto-Migrator note: PostgreSQL auto-sync checked ({pge})")


def get_db_connection():
    """
    Returns an active database connection.
    If DB_ENGINE=postgresql, connects to PostgreSQL with automatic SQLite fallback on failure.
    """
    _ensure_env_loaded()
    db_engine = os.getenv("DB_ENGINE", "").lower().strip()
    if db_engine in ("postgresql", "postgres"):
        pg_conn = get_postgres_connection()
        if pg_conn:
            return PgConnectionWrapper(pg_conn)

    # SQLite connection with WAL mode and non-blocking concurrency
    conn = sqlite3.connect(str(DB_PATH), timeout=60.0, check_same_thread=False, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("PRAGMA busy_timeout=30000")
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

    # 13b. GMB Authorized Employees (Future Whitelist Table)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gmb_authorized_employees (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL UNIQUE,
        full_name TEXT DEFAULT '',
        branch_id TEXT DEFAULT '',
        designation TEXT DEFAULT '',
        mobile TEXT DEFAULT '',
        is_active INTEGER DEFAULT 1,
        created_at TEXT
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_gmb_auth_emp ON gmb_authorized_employees(employee_id)")

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

    # Seed 36 Branches from Official Branch Directory
    branches = [
        ('branch_bc002', 'comp_ssgp', 'Belthangady', 'BC002', 'Belthangady'),
        ('branch_bc003', 'comp_ssgp', 'Udupi', 'BC003', 'Udupi'),
        ('branch_bc004', 'comp_ssgp', 'Kolar', 'BC004', 'Kolar'),
        ('branch_bc005', 'comp_ssgp', 'HO', 'BC005', 'Head Office'),
        ('branch_bc006', 'comp_ssgp', 'Mysore', 'BC006', 'Mysore'),
        ('branch_bc007', 'comp_ssgp', 'Sira', 'BC007', 'Sira'),
        ('branch_bc008', 'comp_ssgp', 'Hubli', 'BC008', 'Hubli'),
        ('branch_bc014', 'comp_ssgp', 'Kanakapura', 'BC014', 'Kanakapura'),
        ('branch_bc016', 'comp_ssgp', 'JP Nagar', 'BC016', 'Bengaluru'),
        ('branch_bc017', 'comp_ssgp', 'Sirsi', 'BC017', 'Sirsi'),
        ('branch_bc019', 'comp_ssgp', 'Anekal', 'BC019', 'Anekal'),
        ('branch_ka0001', 'comp_ssgp', 'Yellapur', 'KA0001', 'Yellapur'),
        ('branch_ka0003', 'comp_ssgp', 'Puttur', 'KA0003', 'Puttur'),
        ('branch_ka0004', 'comp_ssgp', 'Bijapur', 'KA0004', 'Bijapur'),
        ('branch_ka0005', 'comp_ssgp', 'Siddapur', 'KA0005', 'Siddapur'),
        ('branch_ka0006', 'comp_ssgp', 'Karwar', 'KA0006', 'Karwar'),
        ('branch_ka0007', 'comp_ssgp', 'Gadag', 'KA0007', 'Gadag'),
        ('branch_ka0009', 'comp_ssgp', 'Kumta', 'KA0009', 'Kumta'),
        ('branch_ka0010', 'comp_ssgp', 'Shimoga', 'KA0010', 'Shimoga'),
        ('branch_ka0011', 'comp_ssgp', 'Mangalore', 'KA0011', 'Mangalore'),
        ('branch_ka0012', 'comp_ssgp', 'Haliyal', 'KA0012', 'Haliyal'),
        ('branch_ka0013', 'comp_ssgp', 'RT Nagar', 'KA0013', 'Bengaluru'),
        ('branch_ka0014', 'comp_ssgp', 'KR Puram', 'KA0014', 'Bengaluru'),
        ('branch_ka0015', 'comp_ssgp', 'Kundapura', 'KA0015', 'Kundapura'),
        ('branch_ka0016', 'comp_ssgp', 'Sagara', 'KA0016', 'Sagara'),
        ('branch_ka0017', 'comp_ssgp', 'Chithradurga', 'KA0017', 'Chithradurga'),
        ('branch_ka0018', 'comp_ssgp', 'Sarjapura', 'KA0018', 'Bengaluru'),
        ('branch_ka0019', 'comp_ssgp', 'Basaveshwaranagar', 'KA0019', 'Bengaluru'),
        ('branch_ka0020', 'comp_ssgp', 'Bhadravathi', 'KA0020', 'Bhadravathi'),
        ('branch_ka0021', 'comp_ssgp', 'Murudeshwara', 'KA0021', 'Murudeshwara'),
        ('branch_ka0022', 'comp_ssgp', 'Thirthahalli', 'KA0022', 'Thirthahalli'),
        ('branch_ka0023', 'comp_ssgp', 'Raichur', 'KA0023', 'Raichur'),
        ('branch_ka0024', 'comp_ssgp', 'Sullia', 'KA0024', 'Sullia'),
        ('branch_ka0025', 'comp_ssgp', 'Lakshmeshwar', 'KA0025', 'Lakshmeshwar'),
        ('branch_ka0026', 'comp_ssgp', 'Ranebnnur', 'KA0026', 'Ranebnnur'),
        ('branch_ka0027', 'comp_ssgp', 'Malavalli', 'KA0027', 'Malavalli'),
    ]
    for b_id, c_id, name, code, city in branches:
        cursor.execute("SELECT id FROM gmb_branches WHERE code = ? OR id = ?", (code, b_id))
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

    # Seed Default Staff Users (Admin, Staff 1-10, Gate Staff, Gift Staff)
    # Allows 5-10 staff members to login concurrently via individual or shared accounts
    default_staff = [
        ('staff_admin', 'siriadmin', hash_password('siriadmin1234'), 'GBM Chief Admin', 'ADMIN', ''),
        ('staff_env_user', 'staff', hash_password('staff1234'), 'Authorized Event Staff', 'ADMIN', ''),
        ('staff_adarsha', 'ADARSHA', hash_password('ADARSHA1234'), 'Adarsha (Showroom Manager)', 'ADMIN', 'branch_yelahanka'),
        ('staff_gate1', 'gate_staff1', hash_password('gate1234'), 'Gate Staff 1', 'GATE_STAFF', 'branch_yelahanka'),
        ('staff_gate2', 'gate_staff2', hash_password('gate1234'), 'Gate Staff 2', 'GATE_STAFF', 'branch_kolar'),
        ('staff_gift1', 'gift_staff1', hash_password('gift1234'), 'Gift Counter Staff 1', 'GIFT_STAFF', 'branch_yelahanka'),
        ('staff_gift2', 'gift_staff2', hash_password('gift1234'), 'Gift Counter Staff 2', 'GIFT_STAFF', 'branch_kolar'),
    ]

    # Pre-seed staff1 through staff10 with default password 'staff1234'
    for i in range(1, 11):
        default_staff.append((
            f'staff_user_{i}',
            f'staff{i}',
            hash_password('staff1234'),
            f'Event Staff Member {i}',
            'ADMIN',
            'branch_yelahanka'
        ))

    for s_id, s_user, s_pass, s_name, s_role, s_branch in default_staff:
        cursor.execute("SELECT id FROM gmb_staff_users WHERE LOWER(username) = LOWER(?)", (s_user,))
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
