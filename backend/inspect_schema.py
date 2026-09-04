import sqlite3
import json
import re
from pathlib import Path

db_path = Path("sirisamruddhi_crm.db")
conn = sqlite3.connect(str(db_path))
cur = conn.cursor()

cur.execute("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
tables = cur.fetchall()

print(f"Found {len(tables)} tables in SQLite:")
for name, sql in tables:
    cur.execute(f"PRAGMA table_info({name});")
    cols = cur.fetchall()
    col_names = [c[1] for c in cols]
    print(f"- {name} ({len(col_names)} columns): {', '.join(col_names)}")

conn.close()
