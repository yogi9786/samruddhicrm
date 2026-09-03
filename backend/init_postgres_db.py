#!/usr/bin/env python3
"""
Siri Samruddhi CRM - PostgreSQL Database Initializer & Migration Script
Creates all required tables, constraints, indexes, and seed data in PostgreSQL.
"""

import os
import sys
import json
import sqlite3
import hashlib
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load environment
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = int(os.getenv("POSTGRES_PORT", 5432))
DB_NAME = os.getenv("POSTGRES_DB", "sirisamruddhi_crm")
DB_USER = os.getenv("POSTGRES_USER", "sirisamruddhi_admin")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "SiriGold@Secure2026!$#AdminDb")
DATABASE_URL = os.getenv("DATABASE_URL")

SQLITE_DB_PATH = Path(__file__).resolve().parent / "sirisamruddhi_crm.db"

def hash_password(password: str) -> str:
    salt = "ssgp_gmb_salt_2026"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

def connect_postgres():
    try:
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
    except ImportError:
        print("[!] psycopg2-binary is not installed. Installing...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary"])
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

    # First ensure database exists
    try:
        if DATABASE_URL:
            conn = psycopg2.connect(DATABASE_URL)
        else:
            conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASS
            )
        return conn
    except psycopg2.OperationalError as e:
        if f'database "{DB_NAME}" does not exist' in str(e):
            print(f"[*] Database '{DB_NAME}' does not exist. Creating it now...")
            admin_conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                dbname="postgres",
                user=DB_USER,
                password=DB_PASS
            )
            admin_conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cur = admin_conn.cursor()
            cur.execute(f'CREATE DATABASE "{DB_NAME}" OWNER "{DB_USER}";')
            cur.close()
            admin_conn.close()
            print(f"[+] Created database '{DB_NAME}' successfully.")
            return psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASS
            )
        else:
            raise e

def create_tables(conn):
    cur = conn.cursor()
    print("[*] Creating PostgreSQL schema and tables...")

    # 1. Leads Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) DEFAULT '',
        source VARCHAR(100) DEFAULT 'Walk-in',
        status VARCHAR(100) DEFAULT 'New Lead',
        interestedIn VARCHAR(255) DEFAULT 'Gold Jewelry',
        notes TEXT DEFAULT '',
        scheduledCall VARCHAR(100) DEFAULT '',
        createdAt VARCHAR(100),
        callLogs JSONB DEFAULT '[]'::jsonb
    );
    """)

    # 2. Clients Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) DEFAULT '',
        totalPurchases NUMERIC(15, 2) DEFAULT 0.0,
        status VARCHAR(100) DEFAULT 'Won',
        createdAt VARCHAR(100)
    );
    """)

    # 3. Tasks Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        dueDate VARCHAR(100),
        status VARCHAR(100) DEFAULT 'Pending',
        assignedTo VARCHAR(100) DEFAULT 'siriadmin',
        leadId VARCHAR(100) DEFAULT '',
        createdAt VARCHAR(100)
    );
    """)

    # 4. Settings Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        data JSONB
    );
    """)

    # 5. Messages Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(100) PRIMARY KEY,
        sender VARCHAR(255) DEFAULT '',
        recipient VARCHAR(255) DEFAULT '',
        body TEXT DEFAULT '',
        timestamp VARCHAR(100),
        channel VARCHAR(50) DEFAULT 'WhatsApp',
        platform_id VARCHAR(255) DEFAULT '',
        status VARCHAR(50) DEFAULT 'sent'
    );
    """)

    # 6. Email Logs Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS email_logs (
        id VARCHAR(100) PRIMARY KEY,
        to_email VARCHAR(255),
        subject VARCHAR(255),
        timestamp VARCHAR(100),
        status VARCHAR(50),
        messageId VARCHAR(255),
        error TEXT,
        body TEXT
    );
    """)

    # 7. WhatsApp Templates Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS whatsapp_templates (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255),
        category VARCHAR(100),
        language VARCHAR(50),
        body TEXT,
        status VARCHAR(50),
        variables JSONB
    );
    """)

    # 8. GMB Companies Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS gmb_companies (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        is_active INTEGER DEFAULT 1,
        created_at VARCHAR(100)
    );
    """)

    # 9. GMB Branches Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS gmb_branches (
        id VARCHAR(100) PRIMARY KEY,
        company_id VARCHAR(100) NOT NULL REFERENCES gmb_companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        city VARCHAR(100) DEFAULT '',
        is_active INTEGER DEFAULT 1,
        created_at VARCHAR(100)
    );
    """)

    # 10. GMB Events Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS gmb_events (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        event_date VARCHAR(50) NOT NULL,
        venue VARCHAR(255) NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at VARCHAR(100)
    );
    """)

    # 11. GMB Gift Types Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS gmb_gift_types (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        gender VARCHAR(50) NOT NULL,
        description TEXT DEFAULT '',
        is_active INTEGER DEFAULT 1,
        created_at VARCHAR(100)
    );
    """)

    # 12. GMB Staff Users Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS gmb_staff_users (
        id VARCHAR(100) PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        branch_id VARCHAR(100) DEFAULT '',
        is_active INTEGER DEFAULT 1,
        created_at VARCHAR(100)
    );
    """)

    # 13. GMB OTP Challenges Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS gmb_otp_challenges (
        id VARCHAR(100) PRIMARY KEY,
        mobile VARCHAR(50) NOT NULL,
        hashed_otp VARCHAR(255) NOT NULL,
        session_token VARCHAR(255) NOT NULL UNIQUE,
        attempts INTEGER DEFAULT 0,
        is_verified INTEGER DEFAULT 0,
        expires_at VARCHAR(100) NOT NULL,
        created_at VARCHAR(100)
    );
    CREATE INDEX IF NOT EXISTS idx_gmb_otp_mobile ON gmb_otp_challenges(mobile);
    CREATE INDEX IF NOT EXISTS idx_gmb_otp_token ON gmb_otp_challenges(session_token);
    """)

    # 14. GMB Registrations Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS gmb_registrations (
        id VARCHAR(100) PRIMARY KEY,
        event_id VARCHAR(100) NOT NULL REFERENCES gmb_events(id),
        company_id VARCHAR(100) NOT NULL REFERENCES gmb_companies(id),
        branch_id VARCHAR(100) NOT NULL REFERENCES gmb_branches(id),
        name VARCHAR(255) NOT NULL,
        designation VARCHAR(255) NOT NULL,
        mobile VARCHAR(50) NOT NULL,
        email VARCHAR(255) DEFAULT '',
        aadhaar_masked VARCHAR(50) NOT NULL,
        aadhaar_hash VARCHAR(255) NOT NULL,
        employee_id VARCHAR(100) NOT NULL,
        gender VARCHAR(50) NOT NULL,
        photo_url VARCHAR(500) NOT NULL,
        registration_status VARCHAR(50) DEFAULT 'CONFIRMED',
        entry_status VARCHAR(50) DEFAULT 'NOT_ENTERED',
        gift_status VARCHAR(50) DEFAULT 'PENDING',
        created_at VARCHAR(100),
        CONSTRAINT uq_event_mobile UNIQUE(event_id, mobile),
        CONSTRAINT uq_event_emp UNIQUE(event_id, employee_id)
    );
    CREATE INDEX IF NOT EXISTS idx_gmb_reg_event ON gmb_registrations(event_id);
    CREATE INDEX IF NOT EXISTS idx_gmb_reg_mobile ON gmb_registrations(mobile);
    CREATE INDEX IF NOT EXISTS idx_gmb_reg_emp ON gmb_registrations(employee_id);
    CREATE INDEX IF NOT EXISTS idx_gmb_reg_branch ON gmb_registrations(branch_id);
    CREATE INDEX IF NOT EXISTS idx_gmb_reg_entry ON gmb_registrations(entry_status);
    CREATE INDEX IF NOT EXISTS idx_gmb_reg_gift ON gmb_registrations(gift_status);
    """)

    # 15. GMB Event Passes Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS gmb_event_passes (
        id VARCHAR(100) PRIMARY KEY,
        registration_id VARCHAR(100) NOT NULL UNIQUE REFERENCES gmb_registrations(id) ON DELETE CASCADE,
        qr_token VARCHAR(100) NOT NULL UNIQUE,
        pdf_path VARCHAR(500) NOT NULL,
        download_token VARCHAR(100) NOT NULL UNIQUE,
        is_active INTEGER DEFAULT 1,
        created_at VARCHAR(100)
    );
    CREATE INDEX IF NOT EXISTS idx_gmb_pass_qr ON gmb_event_passes(qr_token);
    CREATE INDEX IF NOT EXISTS idx_gmb_pass_download ON gmb_event_passes(download_token);
    """)

    # 16. GMB Entry Scans Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS gmb_entry_scans (
        id VARCHAR(100) PRIMARY KEY,
        pass_id VARCHAR(100) NOT NULL REFERENCES gmb_event_passes(id),
        registration_id VARCHAR(100) NOT NULL REFERENCES gmb_registrations(id),
        staff_id VARCHAR(100) NOT NULL,
        staff_name VARCHAR(255) DEFAULT '',
        gate_name VARCHAR(100) DEFAULT 'Main Gate',
        entry_status VARCHAR(50) NOT NULL,
        device_info VARCHAR(255) DEFAULT '',
        scanned_at VARCHAR(100)
    );
    CREATE INDEX IF NOT EXISTS idx_gmb_entry_reg ON gmb_entry_scans(registration_id);
    """)

    # 17. GMB Gift Redemptions Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS gmb_gift_redemptions (
        id VARCHAR(100) PRIMARY KEY,
        pass_id VARCHAR(100) NOT NULL REFERENCES gmb_event_passes(id),
        registration_id VARCHAR(100) NOT NULL REFERENCES gmb_registrations(id),
        gift_type_id VARCHAR(100) NOT NULL REFERENCES gmb_gift_types(id),
        gift_name VARCHAR(255) NOT NULL,
        staff_id VARCHAR(100) NOT NULL,
        staff_name VARCHAR(255) DEFAULT '',
        counter_name VARCHAR(100) DEFAULT 'Gift Counter 1',
        status VARCHAR(50) NOT NULL,
        redeemed_at VARCHAR(100)
    );
    CREATE INDEX IF NOT EXISTS idx_gmb_gift_reg ON gmb_gift_redemptions(registration_id);
    """)

    # 18. GMB Audit & Scan Logs Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS gmb_scan_logs (
        id VARCHAR(100) PRIMARY KEY,
        pass_id VARCHAR(100) DEFAULT '',
        registration_id VARCHAR(100) DEFAULT '',
        action VARCHAR(100) NOT NULL,
        result VARCHAR(50) NOT NULL,
        staff_id VARCHAR(100) DEFAULT '',
        staff_name VARCHAR(255) DEFAULT '',
        scanner_type VARCHAR(50) DEFAULT 'GATE',
        counter_gate VARCHAR(100) DEFAULT '',
        reason TEXT DEFAULT '',
        created_at VARCHAR(100)
    );
    """)

    # 19. GMB WhatsApp Logs Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS gmb_whatsapp_logs (
        id VARCHAR(100) PRIMARY KEY,
        registration_id VARCHAR(100) NOT NULL REFERENCES gmb_registrations(id) ON DELETE CASCADE,
        mobile VARCHAR(50) NOT NULL,
        template_name VARCHAR(100) DEFAULT '',
        status VARCHAR(50) NOT NULL,
        error_message TEXT DEFAULT '',
        response_payload TEXT DEFAULT '',
        created_at VARCHAR(100)
    );
    """)

    # 20. GMB Email Logs Table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS gmb_email_logs (
        id VARCHAR(100) PRIMARY KEY,
        registration_id VARCHAR(100) NOT NULL REFERENCES gmb_registrations(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) DEFAULT '',
        status VARCHAR(50) NOT NULL,
        message_id VARCHAR(255) DEFAULT '',
        error_message TEXT DEFAULT '',
        created_at VARCHAR(100)
    );
    """)

    conn.commit()
    print("[+] All 20 tables & indexes created successfully in PostgreSQL.")

def seed_defaults(conn):
    cur = conn.cursor()
    now = datetime.now().isoformat() + "Z"
    print("[*] Seeding default records into PostgreSQL...")

    # Company
    cur.execute("SELECT id FROM gmb_companies WHERE code = 'SSGP'")
    if not cur.fetchone():
        cur.execute("""
        INSERT INTO gmb_companies (id, name, code, is_active, created_at)
        VALUES ('comp_ssgp', 'Siri Samruddhi Gold Palace', 'SSGP', 1, %s)
        """, (now,))

    # Branches (36 Official Branches)
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
        cur.execute("SELECT id FROM gmb_branches WHERE code = %s OR id = %s", (code, b_id))
        if not cur.fetchone():
            cur.execute("""
            INSERT INTO gmb_branches (id, company_id, name, code, city, is_active, created_at)
            VALUES (%s, %s, %s, %s, %s, 1, %s)
            """, (b_id, c_id, name, code, city, now))

    # Event
    cur.execute("SELECT id FROM gmb_events WHERE code = 'GBM2026'")
    if not cur.fetchone():
        cur.execute("""
        INSERT INTO gmb_events (id, title, code, event_date, venue, is_active, created_at)
        VALUES ('evt_gbm2026', 'GBM Annual Event 2026', 'GBM2026', '2026-09-02', 'Siri Samruddhi Grand Convention Center', 1, %s)
        """, (now,))

    # Gift Types
    gift_types = [
        ('gift_male', 'Executive Prestige Gift Set', 'male', 'Premium gold-embossed executive watch & pen set'),
        ('gift_female', 'Pure Silk Saree & Jewelry Box', 'female', 'Traditional handloom pure silk saree with luxury velvet jewelry box'),
    ]
    for g_id, g_name, g_gender, g_desc in gift_types:
        cur.execute("SELECT id FROM gmb_gift_types WHERE id = %s", (g_id,))
        if not cur.fetchone():
            cur.execute("""
            INSERT INTO gmb_gift_types (id, name, gender, description, is_active, created_at)
            VALUES (%s, %s, %s, %s, 1, %s)
            """, (g_id, g_name, g_gender, g_desc, now))

    # Staff Users
    default_staff = [
        ('staff_admin', 'siriadmin', hash_password('siriadmin1234'), 'GBM Chief Admin', 'ADMIN', ''),
        ('staff_env_user', 'staff', hash_password('staff1234'), 'Authorized Event Staff', 'ADMIN', ''),
        ('staff_adarsha', 'ADARSHA', hash_password('ADARSHA1234'), 'Adarsha (Showroom Manager)', 'ADMIN', 'branch_yelahanka'),
        ('staff_gate1', 'gate_staff1', hash_password('gate1234'), 'Gate Staff 1', 'GATE_STAFF', 'branch_yelahanka'),
        ('staff_gate2', 'gate_staff2', hash_password('gate1234'), 'Gate Staff 2', 'GATE_STAFF', 'branch_kolar'),
        ('staff_gift1', 'gift_staff1', hash_password('gift1234'), 'Gift Counter Staff 1', 'GIFT_STAFF', 'branch_yelahanka'),
        ('staff_gift2', 'gift_staff2', hash_password('gift1234'), 'Gift Counter Staff 2', 'GIFT_STAFF', 'branch_kolar'),
    ]
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
        cur.execute("SELECT id FROM gmb_staff_users WHERE LOWER(username) = LOWER(%s)", (s_user,))
        if not cur.fetchone():
            cur.execute("""
            INSERT INTO gmb_staff_users (id, username, password_hash, full_name, role, branch_id, is_active, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, 1, %s)
            """, (s_id, s_user, s_pass, s_name, s_role, s_branch, now))

    # Seed VIP Lead
    cur.execute("SELECT id FROM leads WHERE phone = '+91 7996633015' OR phone = '+917996633015'")
    if not cur.fetchone():
        cur.execute("""
        INSERT INTO leads (id, name, phone, email, source, status, interestedIn, notes, scheduledCall, createdAt, callLogs)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            "lead_79966330",
            "Siri Samruddhi VIP Prospect",
            "+91 7996633015",
            "vip.client@sirisamruddhigold.com",
            "Website Inquiry",
            "New Lead",
            "Gold Jewelry",
            "Inquired about antique gold necklace for upcoming family wedding & 100% free making charges offer.",
            "",
            now,
            json.dumps([])
        ))

    conn.commit()
    print("[+] Seed records inserted successfully.")

def copy_from_sqlite_if_exists(conn):
    if not SQLITE_DB_PATH.exists():
        return
    print(f"[*] Found existing SQLite database at {SQLITE_DB_PATH}. Syncing data...")
    sq_conn = sqlite3.connect(str(SQLITE_DB_PATH))
    sq_conn.row_factory = sqlite3.Row
    sq_cur = sq_conn.cursor()
    pg_cur = conn.cursor()

    tables = [
        "leads", "clients", "tasks", "settings", "messages", "email_logs",
        "whatsapp_templates", "gmb_companies", "gmb_branches", "gmb_events",
        "gmb_gift_types", "gmb_staff_users", "gmb_otp_challenges", "gmb_registrations",
        "gmb_event_passes", "gmb_entry_scans", "gmb_gift_redemptions", "gmb_scan_logs",
        "gmb_whatsapp_logs", "gmb_email_logs"
    ]

    for table in tables:
        try:
            sq_cur.execute(f"SELECT * FROM {table}")
            rows = sq_cur.fetchall()
            if not rows:
                continue

            columns = [desc[0] for desc in sq_cur.description]
            cols_str = ", ".join(f'"{c}"' for c in columns)
            placeholders = ", ".join(["%s"] * len(columns))

            insert_sql = f'INSERT INTO {table} ({cols_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING'

            data = []
            for row in rows:
                vals = []
                for c in columns:
                    v = row[c]
                    # Handle json fields if necessary
                    if isinstance(v, (dict, list)):
                        v = json.dumps(v)
                    vals.append(v)
                data.append(tuple(vals))

            pg_cur.executemany(insert_sql, data)
            conn.commit()
            print(f"[+] Migrated {len(data)} rows from SQLite table '{table}' to PostgreSQL.")
        except Exception as e:
            print(f"[-] Note on table {table}: {e}")

    sq_conn.close()

def main():
    print("=" * 60)
    print("  Siri Samruddhi CRM - PostgreSQL Setup & Migration")
    print("=" * 60)
    try:
        conn = connect_postgres()
        print(f"[+] Connected to PostgreSQL database '{DB_NAME}' successfully!")
        create_tables(conn)
        seed_defaults(conn)
        copy_from_sqlite_if_exists(conn)
        conn.close()
        print("=" * 60)
        print("  🎉 PostgreSQL Database Setup Complete!")
        print("  You can now refresh pgAdmin to see all 20 tables & data.")
        print("=" * 60)
    except Exception as e:
        print(f"[X] Database setup error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
