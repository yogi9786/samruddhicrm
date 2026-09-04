#!/usr/bin/env python3
"""
Siri Samruddhi CRM - Complete PostgreSQL Database Initializer & Migration Script
Creates user, database, all 21 tables, constraints, indexes, seeds, and imports SQLite data into PostgreSQL.
"""

import os
import sys
import json
import sqlite3
import hashlib
import argparse
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

def execute_sql_file(pg_conn):
    sql_file = Path(__file__).resolve().parent / "postgres_setup_and_schema.sql"
    if not sql_file.exists():
        print("[!] postgres_setup_and_schema.sql not found.")
        return False
    
    print(f"[*] Executing {sql_file.name} directly against PostgreSQL...")
    with open(sql_file, "r", encoding="utf-8") as f:
        sql_content = f.read()

    cur = pg_conn.cursor()
    cur.execute(sql_content)
    pg_conn.commit()
    print("[+] Successfully executed schema and data script in PostgreSQL!")
    return True

def print_table_summary(pg_conn):
    cur = pg_conn.cursor()
    print("\n" + "=" * 60)
    print(" POSTGRESQL TABLE STATUS & RECORD COUNTS:")
    print("=" * 60)
    
    cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
    """)
    tables = [row[0] for row in cur.fetchall()]
    
    for t in tables:
        try:
            cur.execute(f'SELECT COUNT(*) FROM "{t}";')
            count = cur.fetchone()[0]
            print(f"  • {t:<28} : {count:>5} records")
        except Exception as e:
            print(f"  • {t:<28} : ERROR ({e})")
            
    print("=" * 60 + "\n")

def main():
    parser = argparse.ArgumentParser(description="PostgreSQL Initializer for Siri Samruddhi CRM")
    parser.add_argument("--super-user", default="postgres", help="PostgreSQL superuser (default: postgres)")
    parser.add_argument("--super-pass", default=None, help="PostgreSQL superuser password")
    args = parser.parse_args()

    super_pass = args.super_pass or os.getenv("PG_SUPER_PASS") or os.getenv("PGPASSWORD")
    
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

    if super_pass:
        print(f"[*] Bootstrapping PostgreSQL using superuser '{args.super_user}'...")
        try:
            s_conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                dbname="postgres",
                user=args.super_user,
                password=super_pass
            )
            s_conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cur = s_conn.cursor()

            # Ensure role exists
            cur.execute(f"SELECT 1 FROM pg_roles WHERE rolname = '{DB_USER}';")
            if not cur.fetchone():
                cur.execute(f"CREATE ROLE \"{DB_USER}\" WITH LOGIN SUPERUSER PASSWORD '{DB_PASS}';")
                print(f"[+] Role '{DB_USER}' created.")
            else:
                cur.execute(f"ALTER ROLE \"{DB_USER}\" WITH LOGIN SUPERUSER PASSWORD '{DB_PASS}';")
                print(f"[+] Role '{DB_USER}' updated.")

            # Ensure db exists
            cur.execute(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}';")
            if not cur.fetchone():
                cur.execute(f"CREATE DATABASE \"{DB_NAME}\" OWNER \"{DB_USER}\";")
                print(f"[+] Database '{DB_NAME}' created.")
            
            cur.execute(f"GRANT ALL PRIVILEGES ON DATABASE \"{DB_NAME}\" TO \"{DB_USER}\";")
            cur.close()
            s_conn.close()
        except Exception as e:
            print(f"[!] Superuser bootstrap warning: {e}")

    # Now connect to application database
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
    except Exception as e:
        print(f"[!] Connection failed: {e}")
        return

    execute_sql_file(conn)
    print_table_summary(conn)
    conn.close()

if __name__ == "__main__":
    main()
