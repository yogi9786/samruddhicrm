@echo off
setlocal enabledelayedexpansion

echo =====================================================================
echo  Siri Samruddhi CRM - PostgreSQL Database Setup & Migration Script
echo =====================================================================
echo.

set /p PG_PASS="Enter your PostgreSQL 'postgres' superuser password: "

echo.
echo [*] Initializing PostgreSQL database, creating user, tables and syncing data...
echo.

python init_postgres_db.py --super-pass "!PG_PASS!"

echo.
pause
