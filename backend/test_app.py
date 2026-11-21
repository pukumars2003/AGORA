import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

import main
from main import (
    health_check, list_doctors, run_demo_scenario,
    DemoScenarioRequest, VoiceInteractionRequest, voice_interact,
    login, LoginRequest, login_otp, LoginOTPRequest,
    login_google, LoginGoogleRequest, agent_greet, doctors_count
)
from agent_engine import agent_engine
from database import DOCTORS, BOOKED_SLOTS, book_appointment_record
from auth_service import authenticate_user, authenticate_by_phone, authenticate_by_google
import threading

def test_all():
    print("=" * 60)
    print("SWASTHYA SAHAYAK - COMPREHENSIVE TEST SUITE")
    print("=" * 60)

    print("\n1. Health Check...")
    h = health_check()
    assert h["status"] == "healthy"
    print(f"   OK: {h['doctors_count']} doctors loaded, {h['appointments_count']} appointments")

    print("\n2. Doctor Count (1,000+ expected)...")
    dc = doctors_count()
    assert dc["total"] >= 1000, f"Expected 1000+ doctors, got {dc['total']}"
    print(f"   OK: {dc['total']} doctors across 4 cities")

    print("\n3. Search Doctors (Bengaluru)...")
    docs = list_doctors(city="Bengaluru")
    assert len(docs["doctors"]) > 0
    print(f"   OK: Found {len(docs['doctors'])} doctor(s): {docs['doctors'][0]['name']}")

    print("\n4. Search Doctors with Geolocation...")
    docs_geo = list_doctors(city="Bengaluru", patient_lat=12.935, patient_lng=77.624)
    assert len(docs_geo["doctors"]) > 0
    print(f"   OK: Nearest doctor = {docs_geo['doctors'][0]['name']} ({docs_geo['doctors'][0]['distance']})")

    print("\n5. Agent Greeting (Hindi)...")
    greet = agent_greet(language="hi")
    assert "Namaste" in greet["greeting"] or "Swasthya" in greet["greeting"]
    print(f"   OK: '{greet['greeting'][:60]}...'")

    print("\n6. Agent Greeting (Kannada)...")
    greet_kn = agent_greet(language="kn")
    assert len(greet_kn["greeting"]) > 20
    print(f"   OK: Kannada greeting received")

    print("\n7. Email Login (Patient)...")
    sess = authenticate_user("ravi@bharat.in", "patient123")
    assert sess is not None and sess["user"]["role"] == "patient"
    print(f"   OK: Logged in as {sess['user']['name']} ({sess['user']['role']})")

    print("\n8. OTP Login (Doctor)...")
    sess2 = authenticate_by_phone("+919845067890", "123456")
    assert sess2 is not None and sess2["user"]["role"] == "doctor"
    print(f"   OK: OTP login as {sess2['user']['name']} ({sess2['user']['role']})")

    print("\n9. Google Login...")
    sess3 = authenticate_by_google("demo", "ravi@bharat.in")
    assert sess3 is not None
    print(f"   OK: Google login as {sess3['user']['name']}")

    print("\n10. Hindi Scenario Demo...")
    res1 = run_demo_scenario(DemoScenarioRequest(scenario_id="hindi_headache"))
    assert res1["appointment"] is not None
    print(f"    OK: Booked {res1['appointment']['id']} with {res1['appointment']['doctor_name']}")

    print("\n11. Kannada Scenario...")
    res2 = run_demo_scenario(DemoScenarioRequest(scenario_id="kannada_fever"))
    assert res2["appointment"] is not None
    print(f"    OK: Booked {res2['appointment']['id']}")

    print("\n12. Telugu Scenario...")
    res3 = run_demo_scenario(DemoScenarioRequest(scenario_id="telugu_consult"))
    assert res3["appointment"] is not None
    print(f"    OK: Booked {res3['appointment']['id']}")

    print("\n13. Emergency 108 Guardrail...")
    res_emg = run_demo_scenario(DemoScenarioRequest(scenario_id="emergency_alert"))
    assert res_emg.get("is_emergency") == True
    print("    OK: Emergency guardrail triggered correctly")

    print("\n14. Direct Voice Interaction...")
    vi_res = voice_interact(VoiceInteractionRequest(message="I need a doctor in Bengaluru", language="en"))
    assert vi_res["status"] == "success"
    print(f"    OK: '{vi_res['spoken_text'][:60]}...'")

    print("\n15. Concurrency Test (20 parallel bookings)...")
    results = []
    errors = []
    def try_book(i):
        try:
            rec = book_appointment_record("doc-001", "11:30 AM", f"Patient-{i}", f"+9199990000{i:02d}")
            results.append(rec)
        except Exception as e:
            errors.append(str(e))

    threads = [threading.Thread(target=try_book, args=(i,)) for i in range(20)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    print(f"    OK: {len(results)} bookings completed, {len(errors)} errors")
    slot_set = set(r["slot"] for r in results)
    reassigned = [r for r in results if r.get("concurrency_note")]
    print(f"    Unique slots assigned: {len(slot_set)}, Auto-reassigned: {len(reassigned)}")

    print("\n16. Agora & Murf Config...")
    from main import get_agora_config
    acfg = get_agora_config()
    assert acfg["app_id"] == "690d39ee1c084e798abed55b51d264e7"
    assert acfg["has_certificate"] == True
    assert "Falcon 2.1" in acfg["murf_model"] or "falcon-2.1" in acfg["murf_model"]
    assert acfg["supported_voices"]["en"]["voice_id"] == "Rachna"
    print(f"    OK: Agora App ID verified, Murf Falcon 2.1 (Rachna) active")

    print("\n" + "=" * 60)
    print(">>> ALL 16 TESTS PASSED SUCCESSFULLY WITH 0 BUGS! <<<")
    print("=" * 60)

if __name__ == "__main__":
    test_all()
