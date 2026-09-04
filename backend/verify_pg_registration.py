import os
import uuid
import secrets
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Ensure .env is loaded from possible paths
_candidate_paths = [
    Path(__file__).resolve().parent / ".env",
    Path(__file__).resolve().parents[1] / ".env",
    Path("/var/www/samruddhicrm/backend/.env"),
    Path("/var/www/samruddhicrm/.env"),
]
for cp in _candidate_paths:
    if cp.exists():
        load_dotenv(dotenv_path=cp, override=True)

from app.core.database import get_db_connection, get_postgres_connection

print(f"DB_ENGINE={os.getenv('DB_ENGINE')}")
print(f"POSTGRES_HOST={os.getenv('POSTGRES_HOST')}")
print(f"POSTGRES_DB={os.getenv('POSTGRES_DB')}")

pg = get_postgres_connection()
print(f"Direct get_postgres_connection(): {pg}")

conn = get_db_connection()
print(f"get_db_connection() returned: {type(conn)} ({conn})")

cursor = conn.cursor()
cursor.execute("SELECT count(*) as cnt FROM gmb_registrations")
row = cursor.fetchone()
print(f"gmb_registrations count via get_db_connection(): {row['cnt']}")

cursor.execute("SELECT id, name, mobile, employee_id FROM gmb_registrations ORDER BY created_at DESC LIMIT 5")
rows = cursor.fetchall()
print("Latest 5 registrations via get_db_connection():")
for r in rows:
    print(f"  - {r['id']} | {r['name']} | {r['mobile']} | {r['employee_id']}")

conn.close()
