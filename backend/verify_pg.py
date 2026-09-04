import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

host = os.getenv("POSTGRES_HOST", "localhost")
port = int(os.getenv("POSTGRES_PORT", 5432))
dbname = os.getenv("POSTGRES_DB", "sirisamruddhi_crm")
user = os.getenv("POSTGRES_USER", "sirisamruddhi_admin")
password = os.getenv("POSTGRES_PASSWORD", "SiriGold@Secure2026!$#AdminDb")

conn = psycopg2.connect(host=host, port=port, dbname=dbname, user=user, password=password)
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")
tables = [r[0] for r in cur.fetchall()]

print(f"\n========================================================")
print(f" POSTGRESQL VERIFICATION: {len(tables)} TABLES FOUND IN '{dbname}'")
print(f"========================================================")
for t in tables:
    cur.execute(f'SELECT COUNT(*) FROM "{t}";')
    count = cur.fetchone()[0]
    print(f"  ✓ {t:<28} : {count:>5} records")
print(f"========================================================\n")
conn.close()
