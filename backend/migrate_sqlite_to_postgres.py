import os
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
from pathlib import Path
from dotenv import load_dotenv

# Load environment
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

DB_PATH = Path(__file__).resolve().parent / "sirisamruddhi_crm.db"

def get_pg_connection():
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        return psycopg2.connect(db_url)
    
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = int(os.getenv("POSTGRES_PORT", "5432"))
    dbname = os.getenv("POSTGRES_DB", "sirisamruddhi_crm")
    user = os.getenv("POSTGRES_USER", "sirisamruddhi_admin")
    password = os.getenv("POSTGRES_PASSWORD", "SiriGold@Secure2026!$#AdminDb")
    
    return psycopg2.connect(
        host=host,
        port=port,
        dbname=dbname,
        user=user,
        password=password
    )

def migrate_all():
    print(f"=== Starting Migration from SQLite to PostgreSQL ===")
    print(f"SQLite File: {DB_PATH}")
    
    if not DB_PATH.exists():
        print(f"Warning: SQLite database file {DB_PATH} not found!")
        return

    sqlite_conn = sqlite3.connect(str(DB_PATH))
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()

    try:
        pg_conn = get_pg_connection()
        pg_conn.autocommit = False
        pg_cur = pg_conn.cursor()
        print("Connected to PostgreSQL successfully!")
    except Exception as e:
        print(f"Failed to connect to PostgreSQL: {e}")
        return

    # Tables in dependency order (parents before children)
    tables_order = [
        "leads",
        "clients",
        "tasks",
        "settings",
        "messages",
        "email_logs",
        "whatsapp_templates",
        "gmb_companies",
        "gmb_branches",
        "gmb_events",
        "gmb_gift_types",
        "gmb_staff_users",
        "gmb_otp_challenges",
        "gmb_authorized_employees",
        "gmb_registrations",
        "gmb_event_passes",
        "gmb_entry_scans",
        "gmb_gift_redemptions",
        "gmb_scan_logs",
        "gmb_whatsapp_logs",
        "gmb_email_logs"
    ]

    total_migrated = 0

    for table in tables_order:
        try:
            # Check if table exists in SQLite
            sqlite_cur.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
            if not sqlite_cur.fetchone():
                continue

            # Fetch SQLite rows
            sqlite_cur.execute(f'SELECT * FROM "{table}"')
            rows = sqlite_cur.fetchall()
            if not rows:
                print(f"  - Table '{table}': 0 rows.")
                continue

            col_names = [description[0] for description in sqlite_cur.description]
            cols_str = ", ".join([f'"{col}"' for col in col_names])
            placeholders = ", ".join(["%s" for _ in col_names])
            
            # Use ON CONFLICT DO NOTHING to avoid duplicate key errors
            insert_sql = f'INSERT INTO "{table}" ({cols_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING'

            row_count = 0
            for row in rows:
                values = [row[col] for col in col_names]
                pg_cur.execute(insert_sql, values)
                row_count += 1

            pg_conn.commit()
            print(f"  ✓ Table '{table}': Migrated/Checked {row_count} rows.")
            total_migrated += row_count

        except Exception as table_err:
            pg_conn.rollback()
            print(f"  ✗ Error migrating table '{table}': {table_err}")

    sqlite_conn.close()
    pg_conn.close()
    print(f"=== Migration Completed! Total processed rows: {total_migrated} ===")

if __name__ == "__main__":
    migrate_all()
