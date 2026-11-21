import time
import uuid
from typing import Dict, Any, Optional, List

DEMO_USERS: List[Dict] = [
    {
        "id": "usr-admin-01",
        "email": "admin@swasthya.gov.in",
        "password": "admin123",
        "phone": "+919845099999",
        "otp": "123456",
        "name": "Dr. Ayush Verma",
        "role": "admin",
        "role_label": "System Administrator",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
        "permissions": ["manage_models", "view_rl_stats", "edit_api_keys", "view_appointments"]
    },
    {
        "id": "usr-patient-01",
        "email": "ravi@bharat.in",
        "password": "patient123",
        "phone": "+919845012345",
        "otp": "123456",
        "name": "Ravi Kumar",
        "role": "patient",
        "role_label": "Bharat Citizen / Patient",
        "city": "Bengaluru",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
        "permissions": ["voice_consultation", "book_appointment", "submit_feedback"]
    },
    {
        "id": "usr-patient-02",
        "email": "meera@bharat.in",
        "password": "patient123",
        "phone": "+919876012345",
        "otp": "123456",
        "name": "Meera Reddy",
        "role": "patient",
        "role_label": "Bharat Citizen / Patient",
        "city": "Hyderabad",
        "avatar": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
        "permissions": ["voice_consultation", "book_appointment", "submit_feedback"]
    },
    {
        "id": "usr-patient-03",
        "email": "ankit@bharat.in",
        "password": "patient123",
        "phone": "+919811012345",
        "otp": "123456",
        "name": "Ankit Sharma",
        "role": "patient",
        "role_label": "Bharat Citizen / Patient",
        "city": "Delhi",
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
        "permissions": ["voice_consultation", "book_appointment", "submit_feedback"]
    },
    {
        "id": "usr-patient-04",
        "email": "priya@bharat.in",
        "password": "patient123",
        "phone": "+919820012345",
        "otp": "123456",
        "name": "Priya Desai",
        "role": "patient",
        "role_label": "Bharat Citizen / Patient",
        "city": "Mumbai",
        "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100",
        "permissions": ["voice_consultation", "book_appointment", "submit_feedback"]
    },
    {
        "id": "usr-doctor-01",
        "email": "dr.ramesh@manipal.in",
        "password": "doctor123",
        "phone": "+919845067890",
        "otp": "123456",
        "name": "Dr. Ramesh Kumar",
        "role": "doctor",
        "role_label": "Senior General Physician",
        "city": "Bengaluru",
        "avatar": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100",
        "permissions": ["view_patient_queue", "manage_slots", "clinic_checkin"]
    },
    {
        "id": "usr-doctor-02",
        "email": "dr.lakshmi@apollo.in",
        "password": "doctor123",
        "phone": "+919876067890",
        "otp": "123456",
        "name": "Dr. Lakshmi Prasanna",
        "role": "doctor",
        "role_label": "Senior Neurologist",
        "city": "Hyderabad",
        "avatar": "https://images.unsplash.com/photo-1594824813576-9c471c691376?w=100",
        "permissions": ["view_patient_queue", "manage_slots", "clinic_checkin"]
    },
    {
        "id": "usr-doctor-03",
        "email": "dr.rajesh@fortis.in",
        "password": "doctor123",
        "phone": "+919811067890",
        "otp": "123456",
        "name": "Dr. Rajesh Sharma",
        "role": "doctor",
        "role_label": "Neurologist & Headache Specialist",
        "city": "Delhi",
        "avatar": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=100",
        "permissions": ["view_patient_queue", "manage_slots", "clinic_checkin"]
    },
]

ACTIVE_SESSIONS: Dict[str, Dict[str, Any]] = {}

def _make_session(user: Dict) -> Dict[str, Any]:
    token = f"swasthya_sess_{uuid.uuid4().hex}"
    session_data = {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user.get("email", ""),
            "name": user["name"],
            "role": user["role"],
            "role_label": user["role_label"],
            "avatar": user["avatar"],
            "permissions": user["permissions"],
            "city": user.get("city", ""),
        },
        "created_at": time.time()
    }
    ACTIVE_SESSIONS[token] = session_data
    return session_data

def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    clean_email = email.strip().lower()
    for user in DEMO_USERS:
        if user.get("email", "").lower() == clean_email and user["password"] == password:
            return _make_session(user)
    return None

def authenticate_by_phone(phone: str, otp: str) -> Optional[Dict[str, Any]]:
    clean_phone = phone.strip().replace(" ", "").replace("-", "")
    if not clean_phone.startswith("+91"):
        clean_phone = "+91" + clean_phone.lstrip("+").lstrip("91")
    for user in DEMO_USERS:
        user_phone = user.get("phone", "").replace(" ", "").replace("-", "")
        if user_phone == clean_phone and user.get("otp") == otp.strip():
            return _make_session(user)
    return None

def authenticate_by_google(google_id: str, email: str) -> Optional[Dict[str, Any]]:
    clean_email = email.strip().lower()
    # Match existing user by email
    for user in DEMO_USERS:
        if user.get("email", "").lower() == clean_email:
            return _make_session(user)
    # Auto-create session for demo gmail/bharat accounts
    if clean_email.endswith("@gmail.com") or clean_email.endswith("@bharat.in"):
        name = clean_email.split("@")[0].replace(".", " ").title()
        demo_user = {
            "id": f"usr-google-{uuid.uuid4().hex[:6]}",
            "email": clean_email,
            "name": name,
            "role": "patient",
            "role_label": "Google Sign-In Patient",
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
            "permissions": ["voice_consultation", "book_appointment", "submit_feedback"],
            "city": "Bengaluru",
        }
        return _make_session(demo_user)
    return None

def get_current_user(token: str) -> Optional[Dict[str, Any]]:
    session = ACTIVE_SESSIONS.get(token)
    if session:
        return session["user"]
    return None
