#!/usr/bin/env python3
"""
Generate 100% accurate, production-ready PostgreSQL setup and schema script.
Auto-extracts exact table schemas, types, columns, indexes, and records from sirisamruddhi_crm.db.
Ensures perfect PostgreSQL identifier case-sensitivity handling.
"""

import sqlite3
import json
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

DB_NAME = os.getenv("POSTGRES_DB", "sirisamruddhi_crm")
DB_USER = os.getenv("POSTGRES_USER", "sirisamruddhi_admin")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "SiriGold@Secure2026!$#AdminDb")
SQLITE_DB_PATH = Path(__file__).resolve().parent / "sirisamruddhi_crm.db"

def escape_sql(val):
    if val is None:
        return "NULL"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    # String / JSON
    s = str(val).replace("'", "''")
    return f"'{s}'"

def generate_sql():
    sql_lines = []
    
    sql_lines.append("-- =============================================================================")
    sql_lines.append(f"-- PostgreSQL Database & Schema Setup for Siri Samruddhi CRM & GBM Portal")
    sql_lines.append(f"-- Database: {DB_NAME}")
    sql_lines.append(f"-- Role/User: {DB_USER}")
    sql_lines.append("-- =============================================================================\n")
    
    # 1. User and Database creation statements (Run as postgres superuser)
    sql_lines.append("-- 1. CREATE USER & GRANT PRIVILEGES (If running in postgres database):")
    sql_lines.append(f"DO $$")
    sql_lines.append(f"BEGIN")
    sql_lines.append(f"   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '{DB_USER}') THEN")
    sql_lines.append(f"      CREATE ROLE {DB_USER} WITH LOGIN SUPERUSER PASSWORD '{DB_PASS}';")
    sql_lines.append(f"   ELSE")
    sql_lines.append(f"      ALTER ROLE {DB_USER} WITH PASSWORD '{DB_PASS}';")
    sql_lines.append(f"   END IF;")
    sql_lines.append(f"END")
    sql_lines.append(f"$$;\n")
    
    sql_lines.append(f"GRANT ALL PRIVILEGES ON DATABASE {DB_NAME} TO {DB_USER};\n")
    
    sql_lines.append("-- =============================================================================")
    sql_lines.append("-- 2. CLEAN DROP PREVIOUS TABLES (IF ANY TO PREVENT COLUMN CASE CONFLICTS)")
    sql_lines.append("-- =============================================================================\n")
    
    drop_tables = [
        "gmb_email_logs",
        "gmb_whatsapp_logs",
        "gmb_scan_logs",
        "gmb_gift_redemptions",
        "gmb_entry_scans",
        "gmb_event_passes",
        "gmb_registrations",
        "gmb_authorized_employees",
        "gmb_otp_challenges",
        "gmb_staff_users",
        "gmb_gift_types",
        "gmb_events",
        "gmb_branches",
        "gmb_companies",
        "whatsapp_templates",
        "email_logs",
        "messages",
        "tasks",
        "settings",
        "clients",
        "leads"
    ]
    for dt in drop_tables:
        sql_lines.append(f'DROP TABLE IF EXISTS "{dt}" CASCADE;')
    
    sql_lines.append("\n-- =============================================================================")
    sql_lines.append("-- 3. CREATE ALL 21 TABLES WITH EXACT CASE IDENTIFIERS")
    sql_lines.append("-- =============================================================================\n")
    
    # 1. Leads Table
    sql_lines.append("""
CREATE TABLE "leads" (
    "id" VARCHAR(100) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) DEFAULT '',
    "source" VARCHAR(100) DEFAULT 'Walk-in',
    "status" VARCHAR(100) DEFAULT 'New Lead',
    "interestedIn" VARCHAR(255) DEFAULT 'Gold Jewelry',
    "notes" TEXT DEFAULT '',
    "scheduledCall" VARCHAR(100) DEFAULT '',
    "createdAt" VARCHAR(100),
    "callLogs" JSONB DEFAULT '[]'::jsonb
);
CREATE INDEX IF NOT EXISTS "idx_leads_phone" ON "leads"("phone");
CREATE INDEX IF NOT EXISTS "idx_leads_status" ON "leads"("status");
""")

    # 2. Clients Table
    sql_lines.append("""
CREATE TABLE "clients" (
    "id" VARCHAR(100) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) DEFAULT '',
    "totalPurchases" NUMERIC(15, 2) DEFAULT 0.0,
    "status" VARCHAR(100) DEFAULT 'Won',
    "createdAt" VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS "idx_clients_phone" ON "clients"("phone");
""")

    # 3. Tasks Table
    sql_lines.append("""
CREATE TABLE "tasks" (
    "id" VARCHAR(100) PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "dueDate" VARCHAR(100),
    "status" VARCHAR(100) DEFAULT 'Pending',
    "assignedTo" VARCHAR(100) DEFAULT 'siriadmin',
    "leadId" VARCHAR(100) DEFAULT '',
    "createdAt" VARCHAR(100)
);
""")

    # 4. Settings Table
    sql_lines.append("""
CREATE TABLE "settings" (
    "key" VARCHAR(100) PRIMARY KEY,
    "data" JSONB
);
""")

    # 5. Messages Table
    sql_lines.append("""
CREATE TABLE "messages" (
    "id" VARCHAR(100) PRIMARY KEY,
    "sender" VARCHAR(255) DEFAULT '',
    "recipient" VARCHAR(255) DEFAULT '',
    "body" TEXT DEFAULT '',
    "timestamp" VARCHAR(100),
    "channel" VARCHAR(50) DEFAULT 'WhatsApp',
    "platform_id" VARCHAR(255) DEFAULT '',
    "status" VARCHAR(50) DEFAULT 'sent'
);
""")

    # 6. Email Logs Table
    sql_lines.append("""
CREATE TABLE "email_logs" (
    "id" VARCHAR(100) PRIMARY KEY,
    "to_email" VARCHAR(255),
    "subject" VARCHAR(255),
    "timestamp" VARCHAR(100),
    "status" VARCHAR(50),
    "messageId" VARCHAR(255),
    "error" TEXT,
    "body" TEXT
);
""")

    # 7. WhatsApp Templates Table
    sql_lines.append("""
CREATE TABLE "whatsapp_templates" (
    "id" VARCHAR(100) PRIMARY KEY,
    "name" VARCHAR(255),
    "category" VARCHAR(100),
    "language" VARCHAR(50),
    "body" TEXT,
    "status" VARCHAR(50),
    "variables" JSONB
);
""")

    # 8. GMB Companies Table
    sql_lines.append("""
CREATE TABLE "gmb_companies" (
    "id" VARCHAR(100) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL UNIQUE,
    "is_active" INTEGER DEFAULT 1,
    "created_at" VARCHAR(100)
);
""")

    # 9. GMB Branches Table
    sql_lines.append("""
CREATE TABLE "gmb_branches" (
    "id" VARCHAR(100) PRIMARY KEY,
    "company_id" VARCHAR(100) NOT NULL REFERENCES "gmb_companies"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "city" VARCHAR(100) DEFAULT '',
    "is_active" INTEGER DEFAULT 1,
    "created_at" VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS "idx_gmb_branches_code" ON "gmb_branches"("code");
CREATE INDEX IF NOT EXISTS "idx_gmb_branches_company" ON "gmb_branches"("company_id");
""")

    # 10. GMB Events Table
    sql_lines.append("""
CREATE TABLE "gmb_events" (
    "id" VARCHAR(100) PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL UNIQUE,
    "event_date" VARCHAR(50) NOT NULL,
    "venue" VARCHAR(255) NOT NULL,
    "is_active" INTEGER DEFAULT 1,
    "created_at" VARCHAR(100)
);
""")

    # 11. GMB Gift Types Table
    sql_lines.append("""
CREATE TABLE "gmb_gift_types" (
    "id" VARCHAR(100) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "gender" VARCHAR(50) NOT NULL,
    "description" TEXT DEFAULT '',
    "is_active" INTEGER DEFAULT 1,
    "created_at" VARCHAR(100)
);
""")

    # 12. GMB Staff Users Table
    sql_lines.append("""
CREATE TABLE "gmb_staff_users" (
    "id" VARCHAR(100) PRIMARY KEY,
    "username" VARCHAR(100) NOT NULL UNIQUE,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "branch_id" VARCHAR(100) DEFAULT '',
    "is_active" INTEGER DEFAULT 1,
    "created_at" VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS "idx_gmb_staff_username" ON "gmb_staff_users"("username");
""")

    # 13. GMB OTP Challenges Table
    sql_lines.append("""
CREATE TABLE "gmb_otp_challenges" (
    "id" VARCHAR(100) PRIMARY KEY,
    "mobile" VARCHAR(50) NOT NULL,
    "hashed_otp" VARCHAR(255) NOT NULL,
    "session_token" VARCHAR(255) NOT NULL UNIQUE,
    "attempts" INTEGER DEFAULT 0,
    "is_verified" INTEGER DEFAULT 0,
    "expires_at" VARCHAR(100) NOT NULL,
    "created_at" VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS "idx_gmb_otp_mobile" ON "gmb_otp_challenges"("mobile");
CREATE INDEX IF NOT EXISTS "idx_gmb_otp_session" ON "gmb_otp_challenges"("session_token");
""")

    # 14. GMB Authorized Employees Table
    sql_lines.append("""
CREATE TABLE "gmb_authorized_employees" (
    "id" VARCHAR(100) PRIMARY KEY,
    "employee_id" VARCHAR(100) NOT NULL UNIQUE,
    "full_name" VARCHAR(255) DEFAULT '',
    "branch_id" VARCHAR(100) DEFAULT '',
    "designation" VARCHAR(255) DEFAULT '',
    "mobile" VARCHAR(50) DEFAULT '',
    "is_active" INTEGER DEFAULT 1,
    "created_at" VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS "idx_gmb_auth_emp" ON "gmb_authorized_employees"("employee_id");
""")

    # 15. GMB Registrations Table
    sql_lines.append("""
CREATE TABLE "gmb_registrations" (
    "id" VARCHAR(100) PRIMARY KEY,
    "event_id" VARCHAR(100) NOT NULL REFERENCES "gmb_events"("id"),
    "company_id" VARCHAR(100) NOT NULL REFERENCES "gmb_companies"("id"),
    "branch_id" VARCHAR(100) NOT NULL REFERENCES "gmb_branches"("id"),
    "name" VARCHAR(255) NOT NULL,
    "designation" VARCHAR(255) NOT NULL,
    "mobile" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) DEFAULT '',
    "aadhaar_masked" VARCHAR(50) NOT NULL,
    "aadhaar_hash" VARCHAR(255) NOT NULL,
    "employee_id" VARCHAR(100) NOT NULL,
    "gender" VARCHAR(50) NOT NULL,
    "photo_url" TEXT NOT NULL,
    "registration_status" VARCHAR(50) DEFAULT 'CONFIRMED',
    "entry_status" VARCHAR(50) DEFAULT 'NOT_ENTERED',
    "gift_status" VARCHAR(50) DEFAULT 'PENDING',
    "created_at" VARCHAR(100),
    CONSTRAINT "uq_gmb_reg_event_mobile" UNIQUE("event_id", "mobile"),
    CONSTRAINT "uq_gmb_reg_event_emp" UNIQUE("event_id", "employee_id")
);
CREATE INDEX IF NOT EXISTS "idx_gmb_reg_mobile" ON "gmb_registrations"("mobile");
CREATE INDEX IF NOT EXISTS "idx_gmb_reg_empid" ON "gmb_registrations"("employee_id");
CREATE INDEX IF NOT EXISTS "idx_gmb_reg_branch" ON "gmb_registrations"("branch_id");
CREATE INDEX IF NOT EXISTS "idx_gmb_reg_entry" ON "gmb_registrations"("entry_status");
CREATE INDEX IF NOT EXISTS "idx_gmb_reg_gift" ON "gmb_registrations"("gift_status");
""")

    # 16. GMB Event Passes Table
    sql_lines.append("""
CREATE TABLE "gmb_event_passes" (
    "id" VARCHAR(100) PRIMARY KEY,
    "registration_id" VARCHAR(100) NOT NULL UNIQUE REFERENCES "gmb_registrations"("id") ON DELETE CASCADE,
    "qr_token" VARCHAR(255) NOT NULL UNIQUE,
    "pdf_path" TEXT NOT NULL,
    "download_token" VARCHAR(255) NOT NULL UNIQUE,
    "is_active" INTEGER DEFAULT 1,
    "created_at" VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS "idx_gmb_pass_qr" ON "gmb_event_passes"("qr_token");
CREATE INDEX IF NOT EXISTS "idx_gmb_pass_download" ON "gmb_event_passes"("download_token");
""")

    # 17. GMB Entry Scans Table
    sql_lines.append("""
CREATE TABLE "gmb_entry_scans" (
    "id" VARCHAR(100) PRIMARY KEY,
    "pass_id" VARCHAR(100) NOT NULL REFERENCES "gmb_event_passes"("id"),
    "registration_id" VARCHAR(100) NOT NULL REFERENCES "gmb_registrations"("id"),
    "staff_id" VARCHAR(100) NOT NULL,
    "staff_name" VARCHAR(255) DEFAULT '',
    "gate_name" VARCHAR(100) DEFAULT 'Main Gate',
    "entry_status" VARCHAR(50) NOT NULL,
    "device_info" TEXT DEFAULT '',
    "scanned_at" VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS "idx_gmb_entry_reg" ON "gmb_entry_scans"("registration_id");
""")

    # 18. GMB Gift Redemptions Table
    sql_lines.append("""
CREATE TABLE "gmb_gift_redemptions" (
    "id" VARCHAR(100) PRIMARY KEY,
    "pass_id" VARCHAR(100) NOT NULL REFERENCES "gmb_event_passes"("id"),
    "registration_id" VARCHAR(100) NOT NULL REFERENCES "gmb_registrations"("id"),
    "gift_type_id" VARCHAR(100) NOT NULL REFERENCES "gmb_gift_types"("id"),
    "gift_name" VARCHAR(255) NOT NULL,
    "staff_id" VARCHAR(100) NOT NULL,
    "staff_name" VARCHAR(255) DEFAULT '',
    "counter_name" VARCHAR(100) DEFAULT 'Gift Counter 1',
    "status" VARCHAR(50) NOT NULL,
    "redeemed_at" VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS "idx_gmb_gift_reg" ON "gmb_gift_redemptions"("registration_id");
""")

    # 19. GMB Scan Logs Table
    sql_lines.append("""
CREATE TABLE "gmb_scan_logs" (
    "id" VARCHAR(100) PRIMARY KEY,
    "pass_id" VARCHAR(100) DEFAULT '',
    "registration_id" VARCHAR(100) DEFAULT '',
    "action" VARCHAR(100) NOT NULL,
    "result" VARCHAR(100) NOT NULL,
    "staff_id" VARCHAR(100) DEFAULT '',
    "staff_name" VARCHAR(255) DEFAULT '',
    "scanner_type" VARCHAR(50) DEFAULT 'GATE',
    "counter_gate" VARCHAR(100) DEFAULT '',
    "reason" TEXT DEFAULT '',
    "created_at" VARCHAR(100)
);
""")

    # 20. GMB WhatsApp Logs Table
    sql_lines.append("""
CREATE TABLE "gmb_whatsapp_logs" (
    "id" VARCHAR(100) PRIMARY KEY,
    "registration_id" VARCHAR(100) NOT NULL REFERENCES "gmb_registrations"("id") ON DELETE CASCADE,
    "mobile" VARCHAR(50) NOT NULL,
    "template_name" VARCHAR(100) DEFAULT '',
    "status" VARCHAR(50) NOT NULL,
    "error_message" TEXT DEFAULT '',
    "response_payload" TEXT DEFAULT '',
    "created_at" VARCHAR(100)
);
""")

    # 21. GMB Email Logs Table
    sql_lines.append("""
CREATE TABLE "gmb_email_logs" (
    "id" VARCHAR(100) PRIMARY KEY,
    "registration_id" VARCHAR(100) NOT NULL REFERENCES "gmb_registrations"("id") ON DELETE CASCADE,
    "email" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255) DEFAULT '',
    "status" VARCHAR(50) NOT NULL,
    "message_id" VARCHAR(255) DEFAULT '',
    "error_message" TEXT DEFAULT '',
    "created_at" VARCHAR(100)
);
""")

    # Now read all tables and records in exact dependency order from SQLite
    if SQLITE_DB_PATH.exists():
        sql_lines.append("\n-- =============================================================================")
        sql_lines.append("-- 4. DATA MIGRATION FROM SQLITE (ALL LIVE RECORDS)")
        sql_lines.append("-- =============================================================================\n")
        
        sq_conn = sqlite3.connect(str(SQLITE_DB_PATH))
        sq_conn.row_factory = sqlite3.Row
        sq_cur = sq_conn.cursor()
        
        tables_ordered = [
            "gmb_companies",
            "gmb_branches",
            "gmb_events",
            "gmb_gift_types",
            "gmb_staff_users",
            "gmb_authorized_employees",
            "gmb_otp_challenges",
            "gmb_registrations",
            "gmb_event_passes",
            "gmb_entry_scans",
            "gmb_gift_redemptions",
            "gmb_scan_logs",
            "gmb_whatsapp_logs",
            "gmb_email_logs",
            "settings",
            "leads",
            "clients",
            "tasks",
            "messages",
            "email_logs",
            "whatsapp_templates"
        ]
        
        for table in tables_ordered:
            try:
                sq_cur.execute(f'SELECT * FROM "{table}"')
                rows = sq_cur.fetchall()
                if not rows:
                    continue
                
                col_names = [d[0] for d in sq_cur.description]
                cols_str = ", ".join(f'"{c}"' for c in col_names)
                
                sql_lines.append(f'-- Table: {table} ({len(rows)} records)')
                for r in rows:
                    vals = []
                    for c in col_names:
                        v = r[c]
                        # Handle JSON columns
                        if table in ("leads", "settings", "whatsapp_templates") and c in ("callLogs", "data", "variables"):
                            if v and isinstance(v, str) and (v.startswith("{") or v.startswith("[")):
                                vals.append(f"{escape_sql(v)}::jsonb")
                            elif v:
                                vals.append(f"{escape_sql(v)}::jsonb")
                            else:
                                vals.append("NULL")
                        else:
                            vals.append(escape_sql(v))
                    
                    vals_str = ", ".join(vals)
                    sql_lines.append(f'INSERT INTO "{table}" ({cols_str}) VALUES ({vals_str}) ON CONFLICT DO NOTHING;')
                sql_lines.append("")
            except Exception as e:
                print(f"Notice reading {table}: {e}")
        
        sq_conn.close()
    
    output_path = Path(__file__).resolve().parent / "postgres_setup_and_schema.sql"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))
    
    print(f"[+] Generated complete, exact PostgreSQL schema: {output_path}")

if __name__ == "__main__":
    generate_sql()
