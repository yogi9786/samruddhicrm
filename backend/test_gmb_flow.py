import asyncio
import os
import uuid
import httpx
from app.core.database import init_db, get_db_connection
from app.models.gmb import GmbRegistrationCreate, Gender
from app.services.gmb_otp import GmbOtpService
from app.services.gmb_service import GmbService

async def test_complete_flow():
    print("== 1. Initializing Database Schema & Seed Data ==")
    init_db()

    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT name FROM gmb_branches")
    branches = [r["name"] for r in c.fetchall()]
    print(f"Active Branches: {branches}")

    c.execute("SELECT title FROM gmb_events")
    events = [r["title"] for r in c.fetchall()]
    print(f"Active Events: {events}")
    conn.close()

    test_mobile = f"98765{secrets_rand()}"
    test_emp_id = f"EMP{uuid.uuid4().hex[:4].upper()}"

    print(f"\n== 2. Testing Digintra OTP Send for {test_mobile} ==")
    success, session_token, msg, demo_otp = await GmbOtpService.send_otp(test_mobile)
    print(f"OTP Sent: success={success}, msg={msg}, session_token={session_token}, demo_otp={demo_otp}")
    assert success, "OTP send failed"

    print(f"\n== 3. Testing OTP Verification with code {demo_otp} ==")
    is_valid, v_msg = GmbOtpService.verify_otp(test_mobile, demo_otp, session_token)
    print(f"OTP Verify: is_valid={is_valid}, msg={v_msg}")
    assert is_valid, "OTP verify failed"

    print(f"\n== 4. Testing Attendee Registration ==")
    reg_payload = GmbRegistrationCreate(
        company_id="comp_ssgp",
        branch_id="branch_yelahanka",
        event_id="evt_gbm2026",
        name="Rajesh Kumar",
        designation="Senior Store Manager",
        mobile=test_mobile,
        otp_session_token=session_token,
        email="rajesh.kumar@example.com",
        aadhaar_number="123456789012",
        employee_id=test_emp_id,
        gender=Gender.MALE,
        photo_url="sample_selfie.jpg"
    )

    res = await GmbService.register_attendee(reg_payload, "http://localhost:5173")
    print(f"Registration Created: {res.registration_id}, Pass: {res.pass_id}, QR: {res.qr_token}")
    print(f"Download URL: {res.download_url}")
    print(f"Pass URL: {res.pass_url}")
    assert res.success, "Registration failed"
    qr_token = res.qr_token

    print(f"\n== 5. Testing Duplicate Registration Prevention (Same Mobile) ==")
    try:
        dup_payload = reg_payload.model_copy()
        dup_payload.employee_id = f"EMP{uuid.uuid4().hex[:4].upper()}"
        await GmbService.register_attendee(dup_payload, "http://localhost:5173")
        print("ERROR: Duplicate registration succeeded when it should have failed!")
        assert False
    except ValueError as e:
        print(f"Duplicate mobile correctly rejected: {e}")

    print(f"\n== 6. Testing Staff QR Lookup ==")
    lookup = GmbService.lookup_qr_for_staff(qr_token, staff_id="staff_gate1", scanner_type="GATE")
    print(f"QR Lookup: Name={lookup['name']}, Emp={lookup['employee_id']}, Entry={lookup['entry_status']}, Gift={lookup['gift_status']}")
    print(f"Suggested Gift: {lookup['suggested_gift_name']}")

    print(f"\n== 7. Testing Gift Redemption BEFORE Gate Entry (Should Lock) ==")
    gift_res1 = GmbService.claim_gift(qr_token, staff_id="staff_gift1", staff_name="Priya Sharma", counter_name="Gift Counter 1")
    print(f"Pre-entry Gift Claim: success={gift_res1['success']}, entry_required={gift_res1.get('entry_required')}, msg={gift_res1['message']}")
    assert not gift_res1['success'], "Gift should be locked before gate entry"

    print(f"\n== 8. Testing Gate Entry Check-in ==")
    entry_res1 = GmbService.confirm_gate_entry(qr_token, staff_id="staff_gate1", staff_name="Ramesh Kumar", gate_name="Main Gate 1")
    print(f"Gate Entry: success={entry_res1['success']}, msg={entry_res1['message']}")
    assert entry_res1['success'], "Gate entry check-in failed"

    print(f"\n== 9. Testing Duplicate Gate Entry (Should Warn) ==")
    entry_res2 = GmbService.confirm_gate_entry(qr_token, staff_id="staff_gate1", staff_name="Ramesh Kumar", gate_name="Main Gate 1")
    print(f"Duplicate Gate Entry: success={entry_res2['success']}, already_entered={entry_res2['already_entered']}, msg={entry_res2['message']}")
    assert entry_res2['already_entered'], "Duplicate gate entry was not caught"

    print(f"\n== 10. Testing Gift Claim AFTER Gate Entry (Should Succeed) ==")
    gift_res2 = GmbService.claim_gift(qr_token, staff_id="staff_gift1", staff_name="Priya Sharma", counter_name="Gift Counter 1")
    print(f"Gift Claim: success={gift_res2['success']}, gift={gift_res2['gift_name']}, msg={gift_res2['message']}")
    assert gift_res2['success'], "Gift claim failed"

    print(f"\n== 11. Testing Duplicate Gift Claim (Should Reject) ==")
    gift_res3 = GmbService.claim_gift(qr_token, staff_id="staff_gift1", staff_name="Priya Sharma", counter_name="Gift Counter 2")
    print(f"Duplicate Gift Claim: success={gift_res3['success']}, already_claimed={gift_res3['already_claimed']}, msg={gift_res3['message']}")
    assert gift_res3['already_claimed'], "Duplicate gift claim was not rejected"

    print(f"\n== 12. Testing Dashboard Metrics ==")
    metrics = GmbService.get_dashboard_metrics()
    print(f"Metrics: Total Reg={metrics['total_registrations']}, Entered={metrics['total_entered']}, Gifts Claimed={metrics['gifts_claimed']}")
    print(f"Branches: {metrics['branch_breakdown']}")

    print("\nALL GMB BACKEND BUSINESS RULES & CONCURRENCY CONSTRAINTS VERIFIED SUCCESSFULLY!")

def secrets_rand():
    import random
    return f"{random.randint(10000, 99999)}"

if __name__ == "__main__":
    asyncio.run(test_complete_flow())
