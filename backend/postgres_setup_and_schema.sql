-- =============================================================================
-- PostgreSQL Database & Schema Setup for Siri Samruddhi CRM & GBM Portal
-- Database: sirisamruddhi_crm
-- Role/User: sirisamruddhi_admin
-- =============================================================================

-- 1. CREATE USER & GRANT PRIVILEGES (If running in postgres database):
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'sirisamruddhi_admin') THEN
      CREATE ROLE sirisamruddhi_admin WITH LOGIN SUPERUSER PASSWORD 'SiriGold@Secure2026!$#AdminDb';
   ELSE
      ALTER ROLE sirisamruddhi_admin WITH PASSWORD 'SiriGold@Secure2026!$#AdminDb';
   END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE sirisamruddhi_crm TO sirisamruddhi_admin;

-- =============================================================================
-- 2. CLEAN DROP PREVIOUS TABLES (IF ANY TO PREVENT COLUMN CASE CONFLICTS)
-- =============================================================================

DROP TABLE IF EXISTS "gmb_email_logs" CASCADE;
DROP TABLE IF EXISTS "gmb_whatsapp_logs" CASCADE;
DROP TABLE IF EXISTS "gmb_scan_logs" CASCADE;
DROP TABLE IF EXISTS "gmb_gift_redemptions" CASCADE;
DROP TABLE IF EXISTS "gmb_entry_scans" CASCADE;
DROP TABLE IF EXISTS "gmb_event_passes" CASCADE;
DROP TABLE IF EXISTS "gmb_registrations" CASCADE;
DROP TABLE IF EXISTS "gmb_authorized_employees" CASCADE;
DROP TABLE IF EXISTS "gmb_otp_challenges" CASCADE;
DROP TABLE IF EXISTS "gmb_staff_users" CASCADE;
DROP TABLE IF EXISTS "gmb_gift_types" CASCADE;
DROP TABLE IF EXISTS "gmb_events" CASCADE;
DROP TABLE IF EXISTS "gmb_branches" CASCADE;
DROP TABLE IF EXISTS "gmb_companies" CASCADE;
DROP TABLE IF EXISTS "whatsapp_templates" CASCADE;
DROP TABLE IF EXISTS "email_logs" CASCADE;
DROP TABLE IF EXISTS "messages" CASCADE;
DROP TABLE IF EXISTS "tasks" CASCADE;
DROP TABLE IF EXISTS "settings" CASCADE;
DROP TABLE IF EXISTS "clients" CASCADE;
DROP TABLE IF EXISTS "leads" CASCADE;

-- =============================================================================
-- 3. CREATE ALL 21 TABLES WITH EXACT CASE IDENTIFIERS
-- =============================================================================


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


CREATE TABLE "tasks" (
    "id" VARCHAR(100) PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "dueDate" VARCHAR(100),
    "status" VARCHAR(100) DEFAULT 'Pending',
    "assignedTo" VARCHAR(100) DEFAULT 'siriadmin',
    "leadId" VARCHAR(100) DEFAULT '',
    "createdAt" VARCHAR(100)
);


CREATE TABLE "settings" (
    "key" VARCHAR(100) PRIMARY KEY,
    "data" JSONB
);


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


CREATE TABLE "whatsapp_templates" (
    "id" VARCHAR(100) PRIMARY KEY,
    "name" VARCHAR(255),
    "category" VARCHAR(100),
    "language" VARCHAR(50),
    "body" TEXT,
    "status" VARCHAR(50),
    "variables" JSONB
);


CREATE TABLE "gmb_companies" (
    "id" VARCHAR(100) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL UNIQUE,
    "is_active" INTEGER DEFAULT 1,
    "created_at" VARCHAR(100)
);


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


CREATE TABLE "gmb_events" (
    "id" VARCHAR(100) PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL UNIQUE,
    "event_date" VARCHAR(50) NOT NULL,
    "venue" VARCHAR(255) NOT NULL,
    "is_active" INTEGER DEFAULT 1,
    "created_at" VARCHAR(100)
);


CREATE TABLE "gmb_gift_types" (
    "id" VARCHAR(100) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "gender" VARCHAR(50) NOT NULL,
    "description" TEXT DEFAULT '',
    "is_active" INTEGER DEFAULT 1,
    "created_at" VARCHAR(100)
);


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


-- =============================================================================
-- 4. DATA MIGRATION FROM SQLITE (ALL LIVE RECORDS)
-- =============================================================================

-- Table: gmb_companies (1 records)
INSERT INTO "gmb_companies" ("id", "name", "code", "is_active", "created_at") VALUES ('comp_ssgp', 'Siri Samruddhi Gold Palace', 'SSGP', 1, '2026-09-02T16:18:00.820173Z') ON CONFLICT DO NOTHING;

-- Table: gmb_branches (39 records)
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_yelahanka', 'comp_ssgp', 'Yelahanka', 'YEL', 'Bengaluru', 1, '2026-09-02T16:18:00.820173Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_kolar', 'comp_ssgp', 'Kolar', 'KOL', 'Kolar', 1, '2026-09-02T16:18:00.820173Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_udupi', 'comp_ssgp', 'Udupi', 'UDU', 'Udupi', 1, '2026-09-02T16:18:00.820173Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_bc002', 'comp_ssgp', 'Belthangady', 'BC002', 'Belthangady', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_bc003', 'comp_ssgp', 'Udupi', 'BC003', 'Udupi', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_bc004', 'comp_ssgp', 'Kolar', 'BC004', 'Kolar', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_bc005', 'comp_ssgp', 'HO', 'BC005', 'Head Office', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_bc006', 'comp_ssgp', 'Mysore', 'BC006', 'Mysore', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_bc007', 'comp_ssgp', 'Sira', 'BC007', 'Sira', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_bc008', 'comp_ssgp', 'Hubli', 'BC008', 'Hubli', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_bc014', 'comp_ssgp', 'Kanakapura', 'BC014', 'Kanakapura', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_bc016', 'comp_ssgp', 'JP Nagar', 'BC016', 'Bengaluru', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_bc017', 'comp_ssgp', 'Sirsi', 'BC017', 'Sirsi', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_bc019', 'comp_ssgp', 'Anekal', 'BC019', 'Anekal', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0001', 'comp_ssgp', 'Yellapur', 'KA0001', 'Yellapur', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0003', 'comp_ssgp', 'Puttur', 'KA0003', 'Puttur', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0004', 'comp_ssgp', 'Bijapur', 'KA0004', 'Bijapur', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0005', 'comp_ssgp', 'Siddapur', 'KA0005', 'Siddapur', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0006', 'comp_ssgp', 'Karwar', 'KA0006', 'Karwar', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0007', 'comp_ssgp', 'Gadag', 'KA0007', 'Gadag', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0009', 'comp_ssgp', 'Kumta', 'KA0009', 'Kumta', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0010', 'comp_ssgp', 'Shimoga', 'KA0010', 'Shimoga', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0011', 'comp_ssgp', 'Mangalore', 'KA0011', 'Mangalore', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0012', 'comp_ssgp', 'Haliyal', 'KA0012', 'Haliyal', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0013', 'comp_ssgp', 'RT Nagar', 'KA0013', 'Bengaluru', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0014', 'comp_ssgp', 'KR Puram', 'KA0014', 'Bengaluru', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0015', 'comp_ssgp', 'Kundapura', 'KA0015', 'Kundapura', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0016', 'comp_ssgp', 'Sagara', 'KA0016', 'Sagara', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0017', 'comp_ssgp', 'Chithradurga', 'KA0017', 'Chithradurga', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0018', 'comp_ssgp', 'Sarjapura', 'KA0018', 'Bengaluru', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0019', 'comp_ssgp', 'Basaveshwaranagar', 'KA0019', 'Bengaluru', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0020', 'comp_ssgp', 'Bhadravathi', 'KA0020', 'Bhadravathi', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0021', 'comp_ssgp', 'Murudeshwara', 'KA0021', 'Murudeshwara', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0022', 'comp_ssgp', 'Thirthahalli', 'KA0022', 'Thirthahalli', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0023', 'comp_ssgp', 'Raichur', 'KA0023', 'Raichur', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0024', 'comp_ssgp', 'Sullia', 'KA0024', 'Sullia', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0025', 'comp_ssgp', 'Lakshmeshwar', 'KA0025', 'Lakshmeshwar', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0026', 'comp_ssgp', 'Ranebnnur', 'KA0026', 'Ranebnnur', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_branches" ("id", "company_id", "name", "code", "city", "is_active", "created_at") VALUES ('branch_ka0027', 'comp_ssgp', 'Malavalli', 'KA0027', 'Malavalli', 1, '2026-09-03T16:59:13.168849Z') ON CONFLICT DO NOTHING;

-- Table: gmb_events (1 records)
INSERT INTO "gmb_events" ("id", "title", "code", "event_date", "venue", "is_active", "created_at") VALUES ('evt_gbm2026', 'GBM Annual Event 2026', 'GBM2026', '2026-09-02', 'Siri Samruddhi Grand Convention Center', 1, '2026-09-02T16:18:00.820173Z') ON CONFLICT DO NOTHING;

-- Table: gmb_gift_types (2 records)
INSERT INTO "gmb_gift_types" ("id", "name", "gender", "description", "is_active", "created_at") VALUES ('gift_male', 'Executive Prestige Gift Set', 'male', 'Premium gold-embossed executive watch & pen set', 1, '2026-09-02T16:18:00.820173Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_gift_types" ("id", "name", "gender", "description", "is_active", "created_at") VALUES ('gift_female', 'Pure Silk Saree & Jewelry Box', 'female', 'Traditional handloom pure silk saree with luxury velvet jewelry box', 1, '2026-09-02T16:18:00.820173Z') ON CONFLICT DO NOTHING;

-- Table: gmb_staff_users (17 records)
INSERT INTO "gmb_staff_users" ("id", "username", "password_hash", "full_name", "role", "branch_id", "is_active", "created_at") VALUES ('staff_admin', 'siriadmin', '0ea3ba1a499ca463494a57a99205ba44420da2461211fad0ec4d357c650beae2', 'GMB Chief Admin', 'ADMIN', '', 1, '2026-09-02T16:18:00.820173Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_staff_users" ("id", "username", "password_hash", "full_name", "role", "branch_id", "is_active", "created_at") VALUES ('staff_gate1', 'gate_staff1', 'd49cf86890bb90efb96af719359b661662ccf2f770591c5114f63324555c7c97', 'Ramesh Kumar (Gate 1)', 'GATE_STAFF', 'branch_yelahanka', 1, '2026-09-02T16:18:00.820173Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_staff_users" ("id", "username", "password_hash", "full_name", "role", "branch_id", "is_active", "created_at") VALUES ('staff_gift1', 'gift_staff1', '07385e271d083df36b622964bf4c0159575043513ee311a1b5d11a25d47f43c7', 'Priya Sharma (Counter 1)', 'GIFT_STAFF', 'branch_yelahanka', 1, '2026-09-02T16:18:00.820173Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_staff_users" ("id", "username", "password_hash", "full_name", "role", "branch_id", "is_active", "created_at") VALUES ('staff_env_user', 'staff', 'b4e0febbac5beb2dbb6359901c12d649f01b78bf250e7db8f394122b4ae15ec8', 'Authorized Event Staff', 'ADMIN', '', 1, '2026-09-02T17:41:43.148806Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_staff_users" ("id", "username", "password_hash", "full_name", "role", "branch_id", "is_active", "created_at") VALUES ('staff_adarsha', 'ADARSHA', 'e94013af85d5bccaa1c58bedef52c60289bda9ba48f29e7ea1209e9e0fb6d14c', 'Adarsha (Showroom Manager)', 'ADMIN', 'branch_yelahanka', 1, '2026-09-03T12:26:21.291074Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_staff_users" ("id", "username", "password_hash", "full_name", "role", "branch_id", "is_active", "created_at") VALUES ('staff_gate2', 'gate_staff2', 'd49cf86890bb90efb96af719359b661662ccf2f770591c5114f63324555c7c97', 'Gate Staff 2', 'GATE_STAFF', 'branch_kolar', 1, '2026-09-03T12:26:21.291074Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_staff_users" ("id", "username", "password_hash", "full_name", "role", "branch_id", "is_active", "created_at") VALUES ('staff_gift2', 'gift_staff2', '07385e271d083df36b622964bf4c0159575043513ee311a1b5d11a25d47f43c7', 'Gift Counter Staff 2', 'GIFT_STAFF', 'branch_kolar', 1, '2026-09-03T12:26:21.291074Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_staff_users" ("id", "username", "password_hash", "full_name", "role", "branch_id", "is_active", "created_at") VALUES ('staff_user_1', 'staff1', 'b4e0febbac5beb2dbb6359901c12d649f01b78bf250e7db8f394122b4ae15ec8', 'Event Staff Member 1', 'ADMIN', 'branch_yelahanka', 1, '2026-09-03T12:26:21.291074Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_staff_users" ("id", "username", "password_hash", "full_name", "role", "branch_id", "is_active", "created_at") VALUES ('staff_user_2', 'staff2', 'b4e0febbac5beb2dbb6359901c12d649f01b78bf250e7db8f394122b4ae15ec8', 'Event Staff Member 2', 'ADMIN', 'branch_yelahanka', 1, '2026-09-03T12:26:21.291074Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_staff_users" ("id", "username", "password_hash", "full_name", "role", "branch_id", "is_active", "created_at") VALUES ('staff_user_3', 'staff3', 'b4e0febbac5beb2dbb6359901c12d649f01b78bf250e7db8f394122b4ae15ec8', 'Event Staff Member 3', 'ADMIN', 'branch_yelahanka', 1, '2026-09-03T12:26:21.291074Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_staff_users" ("id", "username", "password_hash", "full_name", "role", "branch_id", "is_active", "created_at") VALUES ('staff_user_4', 'staff4', 'b4e0febbac5beb2dbb6359901c12d649f01b78bf250e7db8f394122b4ae15ec8', 'Event Staff Member 4', 'ADMIN', 'branch_yelahanka', 1, '2026-09-03T12:26:21.291074Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_staff_users" ("id", "username", "password_hash", "full_name", "role", "branch_id", "is_active", "created_at") VALUES ('staff_user_5', 'staff5', 'b4e0febbac5beb2dbb6359901c12d649f01b78bf250e7db8f394122b4ae15ec8', 'Event Staff Member 5', 'ADMIN', 'branch_yelahanka', 1, '2026-09-03T12:26:21.291074Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_staff_users" ("id", "username", "password_hash", "full_name", "role", "branch_id", "is_active", "created_at") VALUES ('staff_user_6', 'staff6', 'b4e0febbac5beb2dbb6359901c12d649f01b78bf250e7db8f394122b4ae15ec8', 'Event Staff Member 6', 'ADMIN', 'branch_yelahanka', 1, '2026-09-03T12:26:21.291074Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_staff_users" ("id", "username", "password_hash", "full_name", "role", "branch_id", "is_active", "created_at") VALUES ('staff_user_7', 'staff7', 'b4e0febbac5beb2dbb6359901c12d649f01b78bf250e7db8f394122b4ae15ec8', 'Event Staff Member 7', 'ADMIN', 'branch_yelahanka', 1, '2026-09-03T12:26:21.291074Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_staff_users" ("id", "username", "password_hash", "full_name", "role", "branch_id", "is_active", "created_at") VALUES ('staff_user_8', 'staff8', 'b4e0febbac5beb2dbb6359901c12d649f01b78bf250e7db8f394122b4ae15ec8', 'Event Staff Member 8', 'ADMIN', 'branch_yelahanka', 1, '2026-09-03T12:26:21.291074Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_staff_users" ("id", "username", "password_hash", "full_name", "role", "branch_id", "is_active", "created_at") VALUES ('staff_user_9', 'staff9', 'b4e0febbac5beb2dbb6359901c12d649f01b78bf250e7db8f394122b4ae15ec8', 'Event Staff Member 9', 'ADMIN', 'branch_yelahanka', 1, '2026-09-03T12:26:21.291074Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_staff_users" ("id", "username", "password_hash", "full_name", "role", "branch_id", "is_active", "created_at") VALUES ('staff_user_10', 'staff10', 'b4e0febbac5beb2dbb6359901c12d649f01b78bf250e7db8f394122b4ae15ec8', 'Event Staff Member 10', 'ADMIN', 'branch_yelahanka', 1, '2026-09-03T12:26:21.291074Z') ON CONFLICT DO NOTHING;

-- Table: gmb_otp_challenges (13 records)
INSERT INTO "gmb_otp_challenges" ("id", "mobile", "hashed_otp", "session_token", "attempts", "is_verified", "expires_at", "created_at") VALUES ('otp_9a9051ff099f', '9876543320', 'bda9eea919c0677099a4ed2c355a674b8f5f9c2e7c79525a13ee83310cc4032e', 'otp_sess_5ac86f51a86449f59a75c2c4a4414125', 1, 1, '2026-09-02T10:56:22.092643+00:00', '2026-09-02T10:51:22.092643+00:00') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_otp_challenges" ("id", "mobile", "hashed_otp", "session_token", "attempts", "is_verified", "expires_at", "created_at") VALUES ('otp_1861b2c5fde7', '7996633015', '7b0157be6512204ceda7836072c416e2acea98f977fc81052cbe32c356b18329', 'otp_sess_4a3f5923c0d743de921f83f1b8fe1a39', 0, 0, '2026-09-04T06:24:34.436985+00:00', '2026-09-04T06:19:34.436985+00:00') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_otp_challenges" ("id", "mobile", "hashed_otp", "session_token", "attempts", "is_verified", "expires_at", "created_at") VALUES ('otp_6f633b57eb9b', '7996633015', 'ba01c540bde82a3c717e44cd214dbf855ff1b7889fc0c1428b66a02b3b4b2f65', 'otp_sess_83d2b28efd9c4bf2b3ab07feaab3b175', 0, 0, '2026-09-04T06:26:36.037565+00:00', '2026-09-04T06:21:36.037565+00:00') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_otp_challenges" ("id", "mobile", "hashed_otp", "session_token", "attempts", "is_verified", "expires_at", "created_at") VALUES ('otp_d9409b77d81d', '7996633015', '8b24d6fd07b65cbf77cf7e9ac01b808b4f4d89783fd701acf67fade348a17c71', 'otp_sess_268923fd10044560a7c49ae44a4db590', 0, 0, '2026-09-04T06:34:09.364024+00:00', '2026-09-04T06:29:09.364024+00:00') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_otp_challenges" ("id", "mobile", "hashed_otp", "session_token", "attempts", "is_verified", "expires_at", "created_at") VALUES ('otp_545b9bd0cedd', '7996633015', '8b7523d17a502cd876c92312a4172d965daaf8f008fb75d30fe4e4d27b6944ba', 'otp_sess_7bdcab23853848d7b5a2daf2348c993c', 0, 0, '2026-09-04T06:41:31.154927+00:00', '2026-09-04T06:36:31.154927+00:00') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_otp_challenges" ("id", "mobile", "hashed_otp", "session_token", "attempts", "is_verified", "expires_at", "created_at") VALUES ('otp_b933b1ae6c11', '9876553373', '15311f1093567db92e0281a45e20823d0ceeffb47d6d5c44fe992b12c8532be1', 'otp_sess_45a8facbedfb47eca459615892040456', 1, 0, '2026-09-04T06:42:01.567644+00:00', '2026-09-04T06:37:01.567644+00:00') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_otp_challenges" ("id", "mobile", "hashed_otp", "session_token", "attempts", "is_verified", "expires_at", "created_at") VALUES ('otp_37870af40249', '9876539482', 'cbdbbbf55a49513826e50453fbcee438f263b33b9a09e01cd493d7a2a06b20fa', 'otp_sess_a69d0914abb14d6eb8179c1314fef485', 1, 1, '2026-09-04T06:42:21.697524+00:00', '2026-09-04T06:37:21.697524+00:00') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_otp_challenges" ("id", "mobile", "hashed_otp", "session_token", "attempts", "is_verified", "expires_at", "created_at") VALUES ('otp_80849627be8e', '7996633015', '8fbdc2aab399b452b0fd88c009833cf9a8a10384e8641a6ebe7b45738cb929c3', 'otp_sess_0bc4b5f62fbe49e596642af54507a619', 0, 0, '2026-09-04T06:43:24.988160+00:00', '2026-09-04T06:38:24.988160+00:00') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_otp_challenges" ("id", "mobile", "hashed_otp", "session_token", "attempts", "is_verified", "expires_at", "created_at") VALUES ('otp_ec34e2e43830', '9876529192', 'be3851fd35b9a891ec6b60064726385f0ed4f943e3772165eecf4a49dd2e3852', 'otp_sess_6e32d584a66048d4a9114cdaaddd8573', 1, 1, '2026-09-04T06:53:43.369187+00:00', '2026-09-04T06:48:43.369187+00:00') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_otp_challenges" ("id", "mobile", "hashed_otp", "session_token", "attempts", "is_verified", "expires_at", "created_at") VALUES ('otp_4d279e418270', '7996633015', '3ef41b784bc006278d015400ae93241b153fc7bd743a3266f8022d29521fcb48', 'otp_sess_4979cfcadf9443d9afdc94f8c06e4012', 2, 1, '2026-09-04T06:55:14.310834+00:00', '2026-09-04T06:50:14.310834+00:00') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_otp_challenges" ("id", "mobile", "hashed_otp", "session_token", "attempts", "is_verified", "expires_at", "created_at") VALUES ('otp_d7bd15929425', '9876551867', '78faf165ca6895e1bfa6e9a885e96d2518e9046e1b2bdb26046d4377f0b12f0c', 'otp_sess_8707157beb53ea8023b74bfd080f8e63b32274a4', 1, 1, '2026-09-04T07:03:31.460974+00:00', '2026-09-04T06:58:31.460974+00:00') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_otp_challenges" ("id", "mobile", "hashed_otp", "session_token", "attempts", "is_verified", "expires_at", "created_at") VALUES ('otp_7aab04fbaa3a', '9876530777', '20a43f845d6567d9965e5081062301e8b43aa6a22cd2a44cb1435dc0a3ac309e', 'otp_sess_3909071faed315f21537d09a58c4c87bc0571c25', 1, 1, '2026-09-04T07:03:48.297439+00:00', '2026-09-04T06:58:48.297439+00:00') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_otp_challenges" ("id", "mobile", "hashed_otp", "session_token", "attempts", "is_verified", "expires_at", "created_at") VALUES ('otp_f594612f97a5', '9876596219', 'ac0b5ec68c81664377051b719440870a4ade595349178deea7080112197f105f', 'otp_sess_b43fe8e3dbcaacabbe818dd881c9196b2be41b68', 1, 1, '2026-09-04T07:05:46.629579+00:00', '2026-09-04T07:00:46.629579+00:00') ON CONFLICT DO NOTHING;

-- Table: gmb_registrations (13 records)
INSERT INTO "gmb_registrations" ("id", "event_id", "company_id", "branch_id", "name", "designation", "mobile", "email", "aadhaar_masked", "aadhaar_hash", "employee_id", "gender", "photo_url", "registration_status", "entry_status", "gift_status", "created_at") VALUES ('reg_f146dd24603c', 'evt_gbm2026', 'comp_ssgp', 'branch_yelahanka', 'Rajesh Kumar', 'Senior Store Manager', '9876543320', 'rajesh.kumar@example.com', 'XXXX XXXX 9012', '65e16faa1cf16bf1929fb7ee21be8ea1208d634c7df2fd07361a3baffffa62ff', 'EMP1251', 'male', 'sample_selfie.jpg', 'CONFIRMED', 'ENTERED', 'CLAIMED', '2026-09-02T16:21:22.151616Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_registrations" ("id", "event_id", "company_id", "branch_id", "name", "designation", "mobile", "email", "aadhaar_masked", "aadhaar_hash", "employee_id", "gender", "photo_url", "registration_status", "entry_status", "gift_status", "created_at") VALUES ('reg_ab6bde7d7e02', 'evt_gbm2026', 'comp_ssgp', 'branch_yelahanka', 'Anand Murthy', 'Floor Incharge', '9876599999', 'anand.murthy@example.com', 'XXXX XXXX 7777', '6b6b46000378d0dfd460abfdb5f7ee809e01b930b4a00394ef28e87770fbf1e6', 'EMP9999', 'male', 'sample.jpg', 'CONFIRMED', 'ENTERED', 'CLAIMED', '2026-09-02T16:34:39.862931Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_registrations" ("id", "event_id", "company_id", "branch_id", "name", "designation", "mobile", "email", "aadhaar_masked", "aadhaar_hash", "employee_id", "gender", "photo_url", "registration_status", "entry_status", "gift_status", "created_at") VALUES ('reg_cd1d1575b5c5', 'evt_gbm2026', 'comp_ssgp', 'branch_kolar', 'yogi', 'rfr', '7996633013', 'yogesh.unique9844@gmail.com', 'XXXX XXXX 3333', '6c6689bc956825fd48d3fbc619e9a27deecc5ad814391a11a4fbe65e2a0e8a5b', 'RRR333', 'male', 'photo_5d69525b176a4dc3.jpeg', 'CONFIRMED', 'ENTERED', 'PENDING', '2026-09-02T17:34:13.151998Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_registrations" ("id", "event_id", "company_id", "branch_id", "name", "designation", "mobile", "email", "aadhaar_masked", "aadhaar_hash", "employee_id", "gender", "photo_url", "registration_status", "entry_status", "gift_status", "created_at") VALUES ('reg_e1f8d453b5d8', 'evt_gbm2026', 'comp_ssgp', 'branch_udupi', 'kiran', 'sles', '7996633011', 'whenyogeshin@gmail.com', 'XXXX XXXX 3333', '963251e0e1c5a6b0a0d5fbdd20a132ac43758174ba10b202807e4a88ada49e14', 'FFV444', 'male', 'photo_49167131ad664a8b.jpg', 'CONFIRMED', 'NOT_ENTERED', 'PENDING', '2026-09-03T11:41:56.569914Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_registrations" ("id", "event_id", "company_id", "branch_id", "name", "designation", "mobile", "email", "aadhaar_masked", "aadhaar_hash", "employee_id", "gender", "photo_url", "registration_status", "entry_status", "gift_status", "created_at") VALUES ('reg_00ef69f1a28d', 'evt_gbm2026', 'comp_ssgp', 'branch_kolar', 'raja', 'rfrfrf', '4555544444', 'whenyogeshin@gmail.com', 'XXXX XXXX 4353', '41dfda2e470091360a5e6efdaeaa204d658f7377ce2326b6e8b592f3a73b26b3', 'RFR3333', 'male', 'photo_1eb1584b28574ec3.jpeg', 'CONFIRMED', 'NOT_ENTERED', 'PENDING', '2026-09-03T11:47:23.436244Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_registrations" ("id", "event_id", "company_id", "branch_id", "name", "designation", "mobile", "email", "aadhaar_masked", "aadhaar_hash", "employee_id", "gender", "photo_url", "registration_status", "entry_status", "gift_status", "created_at") VALUES ('reg_e8e3493c07be', 'evt_gbm2026', 'comp_ssgp', 'branch_udupi', 'ravi', 'sales', '4567665566', 'yogesh.unique9844@gmail.com', 'XXXX XXXX 5665', '8ac63881b69bf04f737f60bb90fc44e79c16e52f1e6d716c4cbe206296b6982f', 'FRFR44', 'male', 'photo_default.jpg', 'CONFIRMED', 'ENTERED', 'CLAIMED', '2026-09-03T11:56:01.246912Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_registrations" ("id", "event_id", "company_id", "branch_id", "name", "designation", "mobile", "email", "aadhaar_masked", "aadhaar_hash", "employee_id", "gender", "photo_url", "registration_status", "entry_status", "gift_status", "created_at") VALUES ('reg_6e7dbef33cdf', 'evt_gbm2026', 'comp_ssgp', 'branch_yelahanka', 'ram', 'frre', '4546645656', 'yogesh.unique9844@gmail.com', 'XXXX XXXX 6546', '4c681df3a6122fd5500fb9c1a6282b0914891f96dbcf67899a2b267f0f08c4d7', 'REER34', 'male', 'photo_default.jpg', 'CONFIRMED', 'ENTERED', 'CLAIMED', '2026-09-03T12:07:43.815349Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_registrations" ("id", "event_id", "company_id", "branch_id", "name", "designation", "mobile", "email", "aadhaar_masked", "aadhaar_hash", "employee_id", "gender", "photo_url", "registration_status", "entry_status", "gift_status", "created_at") VALUES ('reg_14438e7519f3', 'evt_gbm2026', 'comp_ssgp', 'branch_yelahanka', 'kamakshi', 'rgtgt', '9844199344', 'yogesh.unique9844@gmail.com', 'XXXX XXXX 4354', 'b047f5595c8b3016152f3f1b28e2a25f1243934937169480d137c76b5dd0fe3a', 'TGRG44', 'female', 'photo_cea24bbbbd5b415c.jpeg', 'CONFIRMED', 'NOT_ENTERED', 'PENDING', '2026-09-03T13:35:45.019542Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_registrations" ("id", "event_id", "company_id", "branch_id", "name", "designation", "mobile", "email", "aadhaar_masked", "aadhaar_hash", "employee_id", "gender", "photo_url", "registration_status", "entry_status", "gift_status", "created_at") VALUES ('reg_560c24db99db', 'evt_gbm2026', 'comp_ssgp', 'branch_yelahanka', 'test', 'test', '7996633015', 'yogesh.unique9844@gmail.com', 'XXXX XXXX 3434', 'f096bb8754f50dac3eb49935e52479226371221992dd0f5b8819eedfe2ed0219', 'DD444', 'male', 'photo_b8f246170c9e4379.jpeg', 'CONFIRMED', 'NOT_ENTERED', 'PENDING', '2026-09-03T13:52:41.473536Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_registrations" ("id", "event_id", "company_id", "branch_id", "name", "designation", "mobile", "email", "aadhaar_masked", "aadhaar_hash", "employee_id", "gender", "photo_url", "registration_status", "entry_status", "gift_status", "created_at") VALUES ('reg_ead2d480010a', 'evt_gbm2026', 'comp_ssgp', 'branch_yelahanka', 'Rajesh Kumar', 'Senior Store Manager', '9876539482', 'rajesh.kumar@example.com', 'XXXX XXXX 9012', '65e16faa1cf16bf1929fb7ee21be8ea1208d634c7df2fd07361a3baffffa62ff', 'EMP3912', 'male', 'sample_selfie.jpg', 'CONFIRMED', 'ENTERED', 'CLAIMED', '2026-09-04T12:07:22.562585Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_registrations" ("id", "event_id", "company_id", "branch_id", "name", "designation", "mobile", "email", "aadhaar_masked", "aadhaar_hash", "employee_id", "gender", "photo_url", "registration_status", "entry_status", "gift_status", "created_at") VALUES ('reg_b10d39204407', 'evt_gbm2026', 'comp_ssgp', 'branch_yelahanka', 'Rajesh Kumar', 'Senior Store Manager', '9876529192', 'rajesh.kumar@example.com', 'XXXX XXXX 9012', '65e16faa1cf16bf1929fb7ee21be8ea1208d634c7df2fd07361a3baffffa62ff', 'EMP4B2D', 'male', 'sample_selfie.jpg', 'CONFIRMED', 'ENTERED', 'CLAIMED', '2026-09-04T12:18:44.495555Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_registrations" ("id", "event_id", "company_id", "branch_id", "name", "designation", "mobile", "email", "aadhaar_masked", "aadhaar_hash", "employee_id", "gender", "photo_url", "registration_status", "entry_status", "gift_status", "created_at") VALUES ('reg_ca23d06272a0', 'evt_gbm2026', 'comp_ssgp', 'branch_yelahanka', 'Rajesh Kumar', 'Senior Store Manager', '9876530777', 'rajesh.kumar@example.com', 'XXXX XXXX 9012', '65e16faa1cf16bf1929fb7ee21be8ea1208d634c7df2fd07361a3baffffa62ff', 'EMP0CE1', 'male', 'sample_selfie.jpg', 'CONFIRMED', 'ENTERED', 'CLAIMED', '2026-09-04T12:28:49.488837Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_registrations" ("id", "event_id", "company_id", "branch_id", "name", "designation", "mobile", "email", "aadhaar_masked", "aadhaar_hash", "employee_id", "gender", "photo_url", "registration_status", "entry_status", "gift_status", "created_at") VALUES ('reg_d78b00aa5772', 'evt_gbm2026', 'comp_ssgp', 'branch_yelahanka', 'Rajesh Kumar', 'Senior Store Manager', '9876596219', 'rajesh.kumar@example.com', 'XXXX XXXX 9012', '65e16faa1cf16bf1929fb7ee21be8ea1208d634c7df2fd07361a3baffffa62ff', 'EMP4C28', 'male', 'sample_selfie.jpg', 'CONFIRMED', 'ENTERED', 'CLAIMED', '2026-09-04T12:30:47.553336Z') ON CONFLICT DO NOTHING;

-- Table: gmb_event_passes (13 records)
INSERT INTO "gmb_event_passes" ("id", "registration_id", "qr_token", "pdf_path", "download_token", "is_active", "created_at") VALUES ('pass_43cab97def1d', 'reg_f146dd24603c', 'EVT-175E7D8BCCE4F082', 'C:\Users\wheny\OneDrive\Desktop\sirisamruddhi crm\backend\uploads\passes\pass_EVT-175E7D8BCCE4F082.pdf', 'dl_g3uQJyzF0xt3nHhOpceOGA', 1, '2026-09-02T16:21:22.151616Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_event_passes" ("id", "registration_id", "qr_token", "pdf_path", "download_token", "is_active", "created_at") VALUES ('pass_7ad9a13f83c2', 'reg_ab6bde7d7e02', 'EVT-E19E392F99C0E2B0', 'C:\Users\wheny\OneDrive\Desktop\sirisamruddhi crm\backend\uploads\passes\pass_EVT-E19E392F99C0E2B0.pdf', 'dl_l2xFs4NWbfGWq1RdCGhpKg', 1, '2026-09-02T16:34:39.862931Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_event_passes" ("id", "registration_id", "qr_token", "pdf_path", "download_token", "is_active", "created_at") VALUES ('pass_7caa5aa6e10a', 'reg_cd1d1575b5c5', 'EVT-CDCF479F6600254E', 'C:\Users\wheny\OneDrive\Desktop\sirisamruddhi crm\backend\uploads\passes\pass_EVT-CDCF479F6600254E.pdf', 'dl_p8iGVXRhByEBP8onlTSJQA', 1, '2026-09-02T17:34:13.151998Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_event_passes" ("id", "registration_id", "qr_token", "pdf_path", "download_token", "is_active", "created_at") VALUES ('pass_ac2f89ac5d9c', 'reg_e1f8d453b5d8', 'EVT-2F7F6C55AFA98558', 'C:\Users\wheny\OneDrive\Desktop\sirisamruddhi crm\backend\uploads\passes\pass_EVT-2F7F6C55AFA98558.pdf', 'dl_Z01elavYE9N_-ug7XzCwGQ', 1, '2026-09-03T11:41:56.569914Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_event_passes" ("id", "registration_id", "qr_token", "pdf_path", "download_token", "is_active", "created_at") VALUES ('pass_b71372c5938b', 'reg_00ef69f1a28d', 'EVT-F92D0A7E58E0FE18', 'C:\Users\wheny\OneDrive\Desktop\sirisamruddhi crm\backend\uploads\passes\pass_EVT-F92D0A7E58E0FE18.pdf', 'dl_c6CtLiAz0ObIzGb88W0nYA', 1, '2026-09-03T11:47:23.436244Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_event_passes" ("id", "registration_id", "qr_token", "pdf_path", "download_token", "is_active", "created_at") VALUES ('pass_77e260342ff7', 'reg_e8e3493c07be', 'EVT-D36CA2DC700A6852', 'C:\Users\wheny\OneDrive\Desktop\sirisamruddhi crm\backend\uploads\passes\pass_EVT-D36CA2DC700A6852.pdf', 'dl_92pztWKxONQVGESKSl7iaA', 1, '2026-09-03T11:56:01.246912Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_event_passes" ("id", "registration_id", "qr_token", "pdf_path", "download_token", "is_active", "created_at") VALUES ('pass_061cec667a4b', 'reg_6e7dbef33cdf', 'EVT-C5059F0BAD462C08', 'C:\Users\wheny\OneDrive\Desktop\sirisamruddhi crm\backend\uploads\passes\pass_EVT-C5059F0BAD462C08.pdf', 'dl_44dfklb8BXyQ0v4VYHByyA', 1, '2026-09-03T12:07:43.815349Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_event_passes" ("id", "registration_id", "qr_token", "pdf_path", "download_token", "is_active", "created_at") VALUES ('pass_7ffdf88f4ae4', 'reg_14438e7519f3', 'EVT-96A7EC50A92678BC', 'C:\Users\wheny\OneDrive\Desktop\sirisamruddhi crm\backend\uploads\passes\pass_EVT-96A7EC50A92678BC.pdf', 'dl_8SxKsZF44tuvFD2ewgF6wA', 1, '2026-09-03T13:35:45.019542Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_event_passes" ("id", "registration_id", "qr_token", "pdf_path", "download_token", "is_active", "created_at") VALUES ('pass_0d35ecbdcfaa', 'reg_560c24db99db', 'EVT-FF1D6677626A99FE', 'C:\Users\wheny\OneDrive\Desktop\sirisamruddhi crm\backend\uploads\passes\pass_EVT-FF1D6677626A99FE.pdf', 'dl_dl12mgTlmK1azM7dGCpSgw', 1, '2026-09-03T13:52:41.473536Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_event_passes" ("id", "registration_id", "qr_token", "pdf_path", "download_token", "is_active", "created_at") VALUES ('pass_18855e4aa092', 'reg_ead2d480010a', 'EVT-8965AFFAE91631DE', 'C:\Users\wheny\OneDrive\Desktop\sirisamruddhi crm\backend\uploads\passes\pass_EVT-8965AFFAE91631DE.pdf', 'dl_8LosWQOxKEnAAkKJcMiyYw', 1, '2026-09-04T12:07:22.562585Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_event_passes" ("id", "registration_id", "qr_token", "pdf_path", "download_token", "is_active", "created_at") VALUES ('pass_6eadf4100023', 'reg_b10d39204407', 'EVT-ACA110CA7264B4C1', 'C:\Users\wheny\OneDrive\Desktop\sirisamruddhi crm\backend\uploads\passes\pass_EVT-ACA110CA7264B4C1.pdf', 'dl_o2q27wyPXK1gB6h_hTLJKg', 1, '2026-09-04T12:18:44.495555Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_event_passes" ("id", "registration_id", "qr_token", "pdf_path", "download_token", "is_active", "created_at") VALUES ('pass_a955b4ee9f0a', 'reg_ca23d06272a0', 'EVT-4FD278CCC6766313', 'C:\Users\wheny\OneDrive\Desktop\sirisamruddhi crm\backend\uploads\passes\pass_EVT-4FD278CCC6766313.pdf', 'dl_oEnKy1zV6lHUmVMJ-K78UA', 1, '2026-09-04T12:28:49.488837Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_event_passes" ("id", "registration_id", "qr_token", "pdf_path", "download_token", "is_active", "created_at") VALUES ('pass_600e26cd162e', 'reg_d78b00aa5772', 'EVT-FF0CE09AF5496502', 'C:\Users\wheny\OneDrive\Desktop\sirisamruddhi crm\backend\uploads\passes\pass_EVT-FF0CE09AF5496502.pdf', 'dl_vM4XpuZjuJjgmMQBCxFzgg', 1, '2026-09-04T12:30:47.553336Z') ON CONFLICT DO NOTHING;

-- Table: gmb_entry_scans (9 records)
INSERT INTO "gmb_entry_scans" ("id", "pass_id", "registration_id", "staff_id", "staff_name", "gate_name", "entry_status", "device_info", "scanned_at") VALUES ('ent_7ea71f1a90a8', 'pass_43cab97def1d', 'reg_f146dd24603c', 'staff_gate1', 'Ramesh Kumar', 'Main Gate 1', 'SUCCESS', '', '2026-09-02T16:21:22.332983Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_entry_scans" ("id", "pass_id", "registration_id", "staff_id", "staff_name", "gate_name", "entry_status", "device_info", "scanned_at") VALUES ('scan_cab38bcc401c', 'pass_7ad9a13f83c2', 'reg_ab6bde7d7e02', 'staff_env_user', 'Authorized Event Staff', 'Manual Override', 'ENTERED', '', '2026-09-02T17:42:03.372615Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_entry_scans" ("id", "pass_id", "registration_id", "staff_id", "staff_name", "gate_name", "entry_status", "device_info", "scanned_at") VALUES ('scan_b3a9ed33c946', 'pass_7caa5aa6e10a', 'reg_cd1d1575b5c5', 'staff_env_user', 'Authorized Event Staff', 'Manual Override', 'ENTERED', '', '2026-09-02T17:42:55.891740Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_entry_scans" ("id", "pass_id", "registration_id", "staff_id", "staff_name", "gate_name", "entry_status", "device_info", "scanned_at") VALUES ('scan_e1de51f9b5ba', 'pass_061cec667a4b', 'reg_6e7dbef33cdf', 'staff_admin', 'Chief Administrator', 'Manual Override', 'ENTERED', '', '2026-09-03T12:18:23.025544Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_entry_scans" ("id", "pass_id", "registration_id", "staff_id", "staff_name", "gate_name", "entry_status", "device_info", "scanned_at") VALUES ('scan_17e2ee20dd08', 'pass_77e260342ff7', 'reg_e8e3493c07be', 'staff_env_user', 'Authorized Event Staff', 'Manual Override', 'ENTERED', '', '2026-09-03T12:19:58.047729Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_entry_scans" ("id", "pass_id", "registration_id", "staff_id", "staff_name", "gate_name", "entry_status", "device_info", "scanned_at") VALUES ('ent_315e6dbc4254', 'pass_18855e4aa092', 'reg_ead2d480010a', 'staff_gate1', 'Ramesh Kumar', 'Main Gate 1', 'SUCCESS', '', '2026-09-04T12:07:22.741146Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_entry_scans" ("id", "pass_id", "registration_id", "staff_id", "staff_name", "gate_name", "entry_status", "device_info", "scanned_at") VALUES ('ent_8a1299a429cb', 'pass_6eadf4100023', 'reg_b10d39204407', 'staff_gate1', 'Ramesh Kumar', 'Main Gate 1', 'SUCCESS', '', '2026-09-04T12:18:44.728664Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_entry_scans" ("id", "pass_id", "registration_id", "staff_id", "staff_name", "gate_name", "entry_status", "device_info", "scanned_at") VALUES ('ent_69746c2c4d69', 'pass_a955b4ee9f0a', 'reg_ca23d06272a0', 'staff_gate1', 'Ramesh Kumar', 'Main Gate 1', 'SUCCESS', '', '2026-09-04T12:28:49.697925Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_entry_scans" ("id", "pass_id", "registration_id", "staff_id", "staff_name", "gate_name", "entry_status", "device_info", "scanned_at") VALUES ('ent_3baa4adc2f09', 'pass_600e26cd162e', 'reg_d78b00aa5772', 'staff_gate1', 'Ramesh Kumar', 'Main Gate 1', 'SUCCESS', '', '2026-09-04T12:30:47.752598Z') ON CONFLICT DO NOTHING;

-- Table: gmb_gift_redemptions (9 records)
INSERT INTO "gmb_gift_redemptions" ("id", "pass_id", "registration_id", "gift_type_id", "gift_name", "staff_id", "staff_name", "counter_name", "status", "redeemed_at") VALUES ('red_03aa669b0df6', 'pass_43cab97def1d', 'reg_f146dd24603c', 'gift_male', 'Executive Prestige Gift Set', 'staff_gift1', 'Priya Sharma', 'Gift Counter 1', 'CLAIMED', '2026-09-02T16:21:22.419637Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_gift_redemptions" ("id", "pass_id", "registration_id", "gift_type_id", "gift_name", "staff_id", "staff_name", "counter_name", "status", "redeemed_at") VALUES ('redemp_bdbcaf7c95e2', 'pass_7ad9a13f83c2', 'reg_ab6bde7d7e02', 'gift_male', 'Executive Prestige Gift Set', 'staff_env_user', 'Authorized Event Staff', 'Manual Override', 'CLAIMED', '2026-09-02T17:42:03.372615Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_gift_redemptions" ("id", "pass_id", "registration_id", "gift_type_id", "gift_name", "staff_id", "staff_name", "counter_name", "status", "redeemed_at") VALUES ('redemp_f4d2d8c62d3d', 'pass_7caa5aa6e10a', 'reg_cd1d1575b5c5', 'gift_male', 'Executive Prestige Gift Set', 'staff_env_user', 'Authorized Event Staff', 'Manual Override', 'CLAIMED', '2026-09-02T17:43:42.959547Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_gift_redemptions" ("id", "pass_id", "registration_id", "gift_type_id", "gift_name", "staff_id", "staff_name", "counter_name", "status", "redeemed_at") VALUES ('redemp_48fa528d075d', 'pass_061cec667a4b', 'reg_6e7dbef33cdf', 'gift_female', 'Pure Silk Saree & Jewelry Box', 'staff_admin', 'Chief Administrator', 'Manual Override', 'CLAIMED', '2026-09-03T12:18:23.025544Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_gift_redemptions" ("id", "pass_id", "registration_id", "gift_type_id", "gift_name", "staff_id", "staff_name", "counter_name", "status", "redeemed_at") VALUES ('redemp_d416a5080538', 'pass_77e260342ff7', 'reg_e8e3493c07be', 'gift_male', 'Executive Prestige Gift Set', 'staff_env_user', 'Authorized Event Staff', 'Manual Override', 'CLAIMED', '2026-09-03T12:20:12.897035Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_gift_redemptions" ("id", "pass_id", "registration_id", "gift_type_id", "gift_name", "staff_id", "staff_name", "counter_name", "status", "redeemed_at") VALUES ('red_dc8ad9c84de8', 'pass_18855e4aa092', 'reg_ead2d480010a', 'gift_male', 'Executive Prestige Gift Set', 'staff_gift1', 'Priya Sharma', 'Gift Counter 1', 'CLAIMED', '2026-09-04T12:07:22.790175Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_gift_redemptions" ("id", "pass_id", "registration_id", "gift_type_id", "gift_name", "staff_id", "staff_name", "counter_name", "status", "redeemed_at") VALUES ('red_b16e1da0d9e3', 'pass_6eadf4100023', 'reg_b10d39204407', 'gift_male', 'Executive Prestige Gift Set', 'staff_gift1', 'Priya Sharma', 'Gift Counter 1', 'CLAIMED', '2026-09-04T12:18:44.780484Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_gift_redemptions" ("id", "pass_id", "registration_id", "gift_type_id", "gift_name", "staff_id", "staff_name", "counter_name", "status", "redeemed_at") VALUES ('red_bfbdd06a80c0', 'pass_a955b4ee9f0a', 'reg_ca23d06272a0', 'gift_male', 'Executive Prestige Gift Set', 'staff_gift1', 'Priya Sharma', 'Gift Counter 1', 'CLAIMED', '2026-09-04T12:28:49.749737Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_gift_redemptions" ("id", "pass_id", "registration_id", "gift_type_id", "gift_name", "staff_id", "staff_name", "counter_name", "status", "redeemed_at") VALUES ('red_1e00d00bd257', 'pass_600e26cd162e', 'reg_d78b00aa5772', 'gift_male', 'Executive Prestige Gift Set', 'staff_gift1', 'Priya Sharma', 'Gift Counter 1', 'CLAIMED', '2026-09-04T12:30:47.803524Z') ON CONFLICT DO NOTHING;

-- Table: gmb_scan_logs (39 records)
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_e4d934fed409', 'pass_43cab97def1d', 'reg_f146dd24603c', 'QR_SCANNED', 'SUCCESS', 'staff_gate1', '', 'GATE', '', '', '2026-09-02T16:21:22.275369Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_b47d20c6d97a', 'pass_43cab97def1d', 'reg_f146dd24603c', 'GIFT_LOCKED', 'REJECTED', 'staff_gift1', 'Priya Sharma', 'GIFT', 'Gift Counter 1', 'Attendee has not checked in at Gate Entry yet', '2026-09-02T16:21:22.303259Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_eef729ae206b', 'pass_43cab97def1d', 'reg_f146dd24603c', 'ENTRY_CONFIRMED', 'SUCCESS', 'staff_gate1', 'Ramesh Kumar', 'GATE', 'Main Gate 1', 'Gate entry successfully verified', '2026-09-02T16:21:22.332983Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_fd47ec0aa480', 'pass_43cab97def1d', 'reg_f146dd24603c', 'ENTRY_ALREADY_COMPLETED', 'WARNING', 'staff_gate1', 'Ramesh Kumar', 'GATE', 'Main Gate 1', 'Attendee already checked in previously', '2026-09-02T16:21:22.363594Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_dbb23d589219', 'pass_43cab97def1d', 'reg_f146dd24603c', 'GIFT_CLAIMED', 'SUCCESS', 'staff_gift1', 'Priya Sharma', 'GIFT', 'Gift Counter 1', 'Gift successfully redeemed', '2026-09-02T16:21:22.419637Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_a44041de8723', 'pass_43cab97def1d', 'reg_f146dd24603c', 'GIFT_ALREADY_CLAIMED', 'WARNING', 'staff_gift1', 'Priya Sharma', 'GIFT', 'Gift Counter 2', 'Gift has already been claimed for this pass', '2026-09-02T16:21:22.479127Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('log_ca4268124a1a', 'pass_7ad9a13f83c2', 'reg_ab6bde7d7e02', 'OVERRIDE', 'SUCCESS', 'staff_env_user', 'Authorized Event Staff', 'ADMIN_OVERRIDE', 'Manual Edit', 'Staff override test | Entry: NOT_ENTERED -> ENTERED | Gift: PENDING -> CLAIMED', '2026-09-02T17:42:03.372615Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('log_6db455731194', 'pass_7caa5aa6e10a', 'reg_cd1d1575b5c5', 'OVERRIDE', 'SUCCESS', 'staff_env_user', 'Authorized Event Staff', 'ADMIN_OVERRIDE', 'Manual Edit', 'Manual staff status update via pass view | Entry: NOT_ENTERED -> ENTERED | Gift: PENDING -> PENDING', '2026-09-02T17:42:55.891740Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('log_714ad18d7c26', 'pass_7caa5aa6e10a', 'reg_cd1d1575b5c5', 'OVERRIDE', 'SUCCESS', 'staff_env_user', 'Authorized Event Staff', 'ADMIN_OVERRIDE', 'Manual Edit', 'Manual staff status update via pass view | Entry: ENTERED -> ENTERED | Gift: PENDING -> CLAIMED', '2026-09-02T17:43:42.959547Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('log_493bb60670fa', 'pass_7caa5aa6e10a', 'reg_cd1d1575b5c5', 'OVERRIDE', 'SUCCESS', 'staff_env_user', 'Authorized Event Staff', 'ADMIN_OVERRIDE', 'Manual Edit', 'Manual staff status update via pass view | Entry: ENTERED -> ENTERED | Gift: CLAIMED -> PENDING', '2026-09-02T17:45:29.566701Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('log_4888c3fa9e27', 'pass_061cec667a4b', 'reg_6e7dbef33cdf', 'OVERRIDE', 'SUCCESS', 'staff_admin', 'Chief Administrator', 'ADMIN_OVERRIDE', 'Manual Edit', 'Automated auth verification test | Entry: NOT_ENTERED -> ENTERED | Gift: PENDING -> CLAIMED', '2026-09-03T12:18:23.025544Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('log_d4ade8b2633a', 'pass_061cec667a4b', 'reg_6e7dbef33cdf', 'OVERRIDE', 'SUCCESS', 'staff_admin', 'Chief Administrator', 'ADMIN_OVERRIDE', 'Manual Edit', 'Automated auth verification test | Entry: ENTERED -> ENTERED | Gift: CLAIMED -> CLAIMED', '2026-09-03T12:19:04.621360Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('log_3d25649fad1a', 'pass_77e260342ff7', 'reg_e8e3493c07be', 'OVERRIDE', 'SUCCESS', 'staff_env_user', 'Authorized Event Staff', 'ADMIN_OVERRIDE', 'Manual Edit', 'Status updated via scanned pass modal | Entry: NOT_ENTERED -> ENTERED | Gift: PENDING -> PENDING', '2026-09-03T12:19:58.047729Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('log_2f78e0cb13f2', 'pass_061cec667a4b', 'reg_6e7dbef33cdf', 'OVERRIDE', 'SUCCESS', 'staff_admin', 'Chief Administrator', 'ADMIN_OVERRIDE', 'Manual Edit', 'Automated auth verification test | Entry: ENTERED -> ENTERED | Gift: CLAIMED -> CLAIMED', '2026-09-03T12:20:07.920222Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('log_95f0dcef2c75', 'pass_77e260342ff7', 'reg_e8e3493c07be', 'OVERRIDE', 'SUCCESS', 'staff_env_user', 'Authorized Event Staff', 'ADMIN_OVERRIDE', 'Manual Edit', 'Status updated via scanned pass modal | Entry: ENTERED -> ENTERED | Gift: PENDING -> CLAIMED', '2026-09-03T12:20:12.897035Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_1dd49a12c530', 'pass_18855e4aa092', 'reg_ead2d480010a', 'QR_SCANNED', 'SUCCESS', 'staff_gate1', '', 'GATE', '', '', '2026-09-04T12:07:22.695684Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_b0f743d83856', 'pass_18855e4aa092', 'reg_ead2d480010a', 'GIFT_LOCKED', 'REJECTED', 'staff_gift1', 'Priya Sharma', 'GIFT', 'Gift Counter 1', 'Attendee has not checked in at Gate Entry yet', '2026-09-04T12:07:22.721612Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_76add82d538b', 'pass_18855e4aa092', 'reg_ead2d480010a', 'ENTRY_CONFIRMED', 'SUCCESS', 'staff_gate1', 'Ramesh Kumar', 'GATE', 'Main Gate 1', 'Gate entry successfully verified', '2026-09-04T12:07:22.741146Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_18056719de7b', 'pass_18855e4aa092', 'reg_ead2d480010a', 'ENTRY_ALREADY_COMPLETED', 'WARNING', 'staff_gate1', 'Ramesh Kumar', 'GATE', 'Main Gate 1', 'Attendee already checked in previously', '2026-09-04T12:07:22.760643Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_f8f134c45f34', 'pass_18855e4aa092', 'reg_ead2d480010a', 'GIFT_CLAIMED', 'SUCCESS', 'staff_gift1', 'Priya Sharma', 'GIFT', 'Gift Counter 1', 'Gift successfully redeemed', '2026-09-04T12:07:22.790175Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_6cb90e082acc', 'pass_18855e4aa092', 'reg_ead2d480010a', 'GIFT_ALREADY_CLAIMED', 'WARNING', 'staff_gift1', 'Priya Sharma', 'GIFT', 'Gift Counter 2', 'Gift has already been claimed for this pass', '2026-09-04T12:07:22.818463Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_948a61df557a', 'pass_6eadf4100023', 'reg_b10d39204407', 'QR_SCANNED', 'SUCCESS', 'staff_gate1', '', 'GATE', '', '', '2026-09-04T12:18:44.676361Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_409c5f81d8cd', 'pass_6eadf4100023', 'reg_b10d39204407', 'GIFT_LOCKED', 'REJECTED', 'staff_gift1', 'Priya Sharma', 'GIFT', 'Gift Counter 1', 'Attendee has not checked in at Gate Entry yet', '2026-09-04T12:18:44.704842Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_cf5cd834b1d4', 'pass_6eadf4100023', 'reg_b10d39204407', 'ENTRY_CONFIRMED', 'SUCCESS', 'staff_gate1', 'Ramesh Kumar', 'GATE', 'Main Gate 1', 'Gate entry successfully verified', '2026-09-04T12:18:44.728664Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_f90bd8564708', 'pass_6eadf4100023', 'reg_b10d39204407', 'ENTRY_ALREADY_COMPLETED', 'WARNING', 'staff_gate1', 'Ramesh Kumar', 'GATE', 'Main Gate 1', 'Attendee already checked in previously', '2026-09-04T12:18:44.753188Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_0793444bb0fc', 'pass_6eadf4100023', 'reg_b10d39204407', 'GIFT_CLAIMED', 'SUCCESS', 'staff_gift1', 'Priya Sharma', 'GIFT', 'Gift Counter 1', 'Gift successfully redeemed', '2026-09-04T12:18:44.780484Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_f73cdeb36da2', 'pass_6eadf4100023', 'reg_b10d39204407', 'GIFT_ALREADY_CLAIMED', 'WARNING', 'staff_gift1', 'Priya Sharma', 'GIFT', 'Gift Counter 2', 'Gift has already been claimed for this pass', '2026-09-04T12:18:44.808002Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_179264856fe2', 'pass_a955b4ee9f0a', 'reg_ca23d06272a0', 'QR_SCANNED', 'SUCCESS', 'staff_gate1', '', 'GATE', '', '', '2026-09-04T12:28:49.650969Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_36aeff2de40c', 'pass_a955b4ee9f0a', 'reg_ca23d06272a0', 'GIFT_LOCKED', 'REJECTED', 'staff_gift1', 'Priya Sharma', 'GIFT', 'Gift Counter 1', 'Attendee has not checked in at Gate Entry yet', '2026-09-04T12:28:49.672898Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_2b17b382e1d8', 'pass_a955b4ee9f0a', 'reg_ca23d06272a0', 'ENTRY_CONFIRMED', 'SUCCESS', 'staff_gate1', 'Ramesh Kumar', 'GATE', 'Main Gate 1', 'Gate entry successfully verified', '2026-09-04T12:28:49.697925Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_cdfede5bce5b', 'pass_a955b4ee9f0a', 'reg_ca23d06272a0', 'ENTRY_ALREADY_COMPLETED', 'WARNING', 'staff_gate1', 'Ramesh Kumar', 'GATE', 'Main Gate 1', 'Attendee already checked in previously', '2026-09-04T12:28:49.721721Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_9a8ef22cf39c', 'pass_a955b4ee9f0a', 'reg_ca23d06272a0', 'GIFT_CLAIMED', 'SUCCESS', 'staff_gift1', 'Priya Sharma', 'GIFT', 'Gift Counter 1', 'Gift successfully redeemed', '2026-09-04T12:28:49.749737Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_3e608510ac00', 'pass_a955b4ee9f0a', 'reg_ca23d06272a0', 'GIFT_ALREADY_CLAIMED', 'WARNING', 'staff_gift1', 'Priya Sharma', 'GIFT', 'Gift Counter 2', 'Gift has already been claimed for this pass', '2026-09-04T12:28:49.773484Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_cdf8865bab75', 'pass_600e26cd162e', 'reg_d78b00aa5772', 'QR_SCANNED', 'SUCCESS', 'staff_gate1', '', 'GATE', '', '', '2026-09-04T12:30:47.703293Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_f2c3e79025b9', 'pass_600e26cd162e', 'reg_d78b00aa5772', 'GIFT_LOCKED', 'REJECTED', 'staff_gift1', 'Priya Sharma', 'GIFT', 'Gift Counter 1', 'Attendee has not checked in at Gate Entry yet', '2026-09-04T12:30:47.725251Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_c22921672712', 'pass_600e26cd162e', 'reg_d78b00aa5772', 'ENTRY_CONFIRMED', 'SUCCESS', 'staff_gate1', 'Ramesh Kumar', 'GATE', 'Main Gate 1', 'Gate entry successfully verified', '2026-09-04T12:30:47.752598Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_14909ece0226', 'pass_600e26cd162e', 'reg_d78b00aa5772', 'ENTRY_ALREADY_COMPLETED', 'WARNING', 'staff_gate1', 'Ramesh Kumar', 'GATE', 'Main Gate 1', 'Attendee already checked in previously', '2026-09-04T12:30:47.774354Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_a7265532a1f4', 'pass_600e26cd162e', 'reg_d78b00aa5772', 'GIFT_CLAIMED', 'SUCCESS', 'staff_gift1', 'Priya Sharma', 'GIFT', 'Gift Counter 1', 'Gift successfully redeemed', '2026-09-04T12:30:47.803524Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_scan_logs" ("id", "pass_id", "registration_id", "action", "result", "staff_id", "staff_name", "scanner_type", "counter_gate", "reason", "created_at") VALUES ('scan_ff5b4dffb282', 'pass_600e26cd162e', 'reg_d78b00aa5772', 'GIFT_ALREADY_CLAIMED', 'WARNING', 'staff_gift1', 'Priya Sharma', 'GIFT', 'Gift Counter 2', 'Gift has already been claimed for this pass', '2026-09-04T12:30:47.831730Z') ON CONFLICT DO NOTHING;

-- Table: gmb_whatsapp_logs (9 records)
INSERT INTO "gmb_whatsapp_logs" ("id", "registration_id", "mobile", "template_name", "status", "error_message", "response_payload", "created_at") VALUES ('wa_c99c833c0baf', 'reg_f146dd24603c', '9876543320', 'gmb_event_pass', 'SENT', '', 'Mock WhatsApp message delivered to +919876543320: Hello Rajesh Kumar, your pass is ready at http://localhost:5173/gmb/pass/EVT-175E7D8BCCE4F082', '2026-09-02T16:21:22.509669Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_whatsapp_logs" ("id", "registration_id", "mobile", "template_name", "status", "error_message", "response_payload", "created_at") VALUES ('wa_4a212167634e', 'reg_ab6bde7d7e02', '9876599999', 'gmb_event_pass', 'SENT', '', 'Mock WhatsApp message delivered to +919876599999: Hello Anand Murthy, your pass is ready at http://localhost:5173/gmb/pass/EVT-E19E392F99C0E2B0', '2026-09-02T16:34:39.963712Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_whatsapp_logs" ("id", "registration_id", "mobile", "template_name", "status", "error_message", "response_payload", "created_at") VALUES ('wa_b8ce17581281', 'reg_cd1d1575b5c5', '7996633013', 'gmb_event_pass', 'SENT', '', 'Mock WhatsApp message delivered to +917996633013: Hello yogi, your pass is ready at http://localhost:5173/gbm/pass/EVT-CDCF479F6600254E', '2026-09-02T17:34:13.428893Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_whatsapp_logs" ("id", "registration_id", "mobile", "template_name", "status", "error_message", "response_payload", "created_at") VALUES ('wa_b6ebd86e65ec', 'reg_e1f8d453b5d8', '7996633011', 'gmb_event_pass', 'SENT', '', 'Mock WhatsApp message delivered to +917996633011: Hello kiran, your pass is ready at http://localhost:5173/gbm/pass/EVT-2F7F6C55AFA98558', '2026-09-03T11:41:56.869375Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_whatsapp_logs" ("id", "registration_id", "mobile", "template_name", "status", "error_message", "response_payload", "created_at") VALUES ('wa_2910cd087529', 'reg_00ef69f1a28d', '4555544444', 'gmb_event_pass', 'SENT', '', 'Mock WhatsApp message delivered to +914555544444: Hello raja, your pass is ready at http://localhost:5173/gbm/pass/EVT-F92D0A7E58E0FE18', '2026-09-03T11:47:23.654112Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_whatsapp_logs" ("id", "registration_id", "mobile", "template_name", "status", "error_message", "response_payload", "created_at") VALUES ('wa_f7c45b98ddca', 'reg_e8e3493c07be', '4567665566', 'gmb_event_pass', 'SENT', '', 'Mock WhatsApp message delivered to +914567665566: Hello ravi, your pass is ready at http://localhost:5173/gbm/pass/EVT-D36CA2DC700A6852', '2026-09-03T11:56:01.363492Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_whatsapp_logs" ("id", "registration_id", "mobile", "template_name", "status", "error_message", "response_payload", "created_at") VALUES ('wa_f7886717a4b2', 'reg_6e7dbef33cdf', '4546645656', 'gmb_event_pass', 'SENT', '', 'Mock WhatsApp message delivered to +914546645656: Hello ram, your pass is ready at http://localhost:5173/gbm/pass/EVT-C5059F0BAD462C08', '2026-09-03T12:07:43.917239Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_whatsapp_logs" ("id", "registration_id", "mobile", "template_name", "status", "error_message", "response_payload", "created_at") VALUES ('wa_138656ee0747', 'reg_14438e7519f3', '9844199344', 'gbm_event_registration_success', 'FAILED', 'AiSensy HTTP 401: {"name":"ERR401","message":"Unauthorized"}', '{"name":"ERR401","message":"Unauthorized"}', '2026-09-03T13:35:45.408632Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_whatsapp_logs" ("id", "registration_id", "mobile", "template_name", "status", "error_message", "response_payload", "created_at") VALUES ('wa_432d22c73869', 'reg_560c24db99db', '7996633015', 'gbm_event_registration_success', 'SENT', '', '{"success":"true","submitted_message_id":"f01937cb-037a-4413-9267-e7c24097a951"}', '2026-09-03T13:52:41.855827Z') ON CONFLICT DO NOTHING;

-- Table: gmb_email_logs (7 records)
INSERT INTO "gmb_email_logs" ("id", "registration_id", "email", "subject", "status", "message_id", "error_message", "created_at") VALUES ('em_23e3c54844c1', 'reg_cd1d1575b5c5', 'yogesh.unique9844@gmail.com', 'GBM Annual Event 2026 Pass', 'SENT', '<202609021204.47192334502@smtp-relay.mailin.fr>', '', '2026-09-02T17:34:13.462206Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_email_logs" ("id", "registration_id", "email", "subject", "status", "message_id", "error_message", "created_at") VALUES ('em_1d038402ef3a', 'reg_e1f8d453b5d8', 'whenyogeshin@gmail.com', 'GBM Annual Event 2026 Pass', 'SENT', '<202609030611.97806433559@smtp-relay.mailin.fr>', '', '2026-09-03T11:41:56.901725Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_email_logs" ("id", "registration_id", "email", "subject", "status", "message_id", "error_message", "created_at") VALUES ('em_da1fac3593e0', 'reg_00ef69f1a28d', 'whenyogeshin@gmail.com', 'GBM Annual Event 2026 Pass', 'SENT', '<202609030617.91561317091@smtp-relay.mailin.fr>', '', '2026-09-03T11:47:23.682259Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_email_logs" ("id", "registration_id", "email", "subject", "status", "message_id", "error_message", "created_at") VALUES ('em_2313e6d6d70e', 'reg_e8e3493c07be', 'yogesh.unique9844@gmail.com', 'GBM Annual Event 2026 Pass', 'SENT', '<202609030625.59673231311@smtp-relay.mailin.fr>', '', '2026-09-03T11:56:01.393563Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_email_logs" ("id", "registration_id", "email", "subject", "status", "message_id", "error_message", "created_at") VALUES ('em_6a0ecb3aca0a', 'reg_6e7dbef33cdf', 'yogesh.unique9844@gmail.com', 'GBM Annual Event 2026 Pass', 'SENT', '<202609030637.72572206157@smtp-relay.mailin.fr>', '', '2026-09-03T12:07:43.957568Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_email_logs" ("id", "registration_id", "email", "subject", "status", "message_id", "error_message", "created_at") VALUES ('em_718b8424db58', 'reg_14438e7519f3', 'yogesh.unique9844@gmail.com', 'GBM Annual Event 2026 Pass', 'SENT', '<202609030805.86522872894@smtp-relay.mailin.fr>', '', '2026-09-03T13:35:46.692781Z') ON CONFLICT DO NOTHING;
INSERT INTO "gmb_email_logs" ("id", "registration_id", "email", "subject", "status", "message_id", "error_message", "created_at") VALUES ('em_c0e6dacfd9be', 'reg_560c24db99db', 'yogesh.unique9844@gmail.com', 'GBM Annual Event 2026 Pass', 'SENT', '<202609030822.30205076385@smtp-relay.mailin.fr>', '', '2026-09-03T13:52:43.086529Z') ON CONFLICT DO NOTHING;

-- Table: leads (3 records)
INSERT INTO "leads" ("id", "name", "phone", "email", "source", "status", "interestedIn", "notes", "scheduledCall", "createdAt", "callLogs") VALUES ('lead_79966330', 'Siri Samruddhi VIP Prospect', '+91 7996633015', 'vip.client@sirisamruddhigold.com', 'Website Inquiry', 'New Lead', 'Gold Jewelry', 'Inquired about antique gold necklace for upcoming family wedding & 100% free making charges offer. Ready for AI Voice Agent call.', '', '2026-08-24T12:02:59.772122Z', '[]'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO "leads" ("id", "name", "phone", "email", "source", "status", "interestedIn", "notes", "scheduledCall", "createdAt", "callLogs") VALUES ('lead_2bc0d8e9', 'Yogesh V', '+917996633015', 'yogesh.unique9844@gmail.com', 'Walk-in', 'New Lead', 'Gold Jewelry', 'tr', '', '2026-08-24T12:08:07.648940Z', '[]'::jsonb) ON CONFLICT DO NOTHING;
INSERT INTO "leads" ("id", "name", "phone", "email", "source", "status", "interestedIn", "notes", "scheduledCall", "createdAt", "callLogs") VALUES ('lead_48254df7', 'Aarav Sharma', '+91 9845012345', 'aarav.sharma@example.com', 'Meta Ads', 'New Lead', 'Diamond Necklace', 'Interested in bridal collection', '', '2026-08-24T12:08:28.699751Z', '[]'::jsonb) ON CONFLICT DO NOTHING;
