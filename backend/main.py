from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import time
import os
import uuid
from datetime import datetime

from config import settings
from database import (
    DOCTORS, APPOINTMENTS, PRESCRIPTIONS, search_doctors,
    get_slots, book_appointment_record, scan_prescription_data, get_doctor_by_id
)
from symptom_rag import analyze_symptoms_and_triage
from scheduler_service import get_live_events, emit_event, schedule_appointment_reminders_and_followup
from agora_service import (
    get_agora_conversational_ai_config, MURF_VOICE_MAP,
    generate_agora_rtc_token, stream_murf_falcon_audio,
    join_agora_conversational_agent, AGORA_OUTBOUND_REMINDER_PROMPT
)
from agent_engine import agent_engine, TOOL_DEFINITIONS, execute_tool_call
from model_router import model_router, rl_learner
from auth_service import authenticate_user, authenticate_by_phone, authenticate_by_google, get_current_user, DEMO_USERS

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Voice AI for Bharat: Multilingual Healthcare Assistant using Agora Conversational AI & Murf Falcon TTS",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DIST_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(DIST_PATH) and os.path.exists(os.path.join(DIST_PATH, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_PATH, "assets")), name="assets")

@app.get("/")
def root():
    index_file = os.path.join(DIST_PATH, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "languages": ["Hindi (hi-IN)", "Kannada (kn-IN)", "Telugu (te-IN)", "English (en-IN)"],
        "agora_app_id": settings.AGORA_APP_ID
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "doctors_count": len(DOCTORS),
        "appointments_count": len(APPOINTMENTS),
        "events_count": len(get_live_events())
    }

# --- Agent Greeting / Welcome endpoint ---
@app.get("/api/agent/greet")
def agent_greet(language: Optional[str] = "hi"):
    """Returns the agent's initial greeting to speak on page load."""
    greetings = {
        "hi": "Namaste! Main Swasthya Sahayak hoon, aapka healthcare assistant. Aap mujhe batayein — kya takleef hai ya kis doctor se milna hai? Main aapki madad ke liye yahan hoon!",
        "kn": "ನಮಸ್ಕಾರ! ನಾನು ಸ್ವಾಸ್ಥ್ಯ ಸಹಾಯಕ, ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಹಾಯಕ. ನಿಮಗೆ ಏನು ತೊಂದರೆ ಇದೆ ಎಂದು ಹೇಳಿ. ನಾನು ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ!",
        "te": "నమస్కారం! నేను స్వాస్థ్య సహాయక్, మీ హెల్త్‌కేర్ అసిస్టెంట్. మీకు ఏ సమస్య ఉందో చెప్పండి. మీకు సహాయం చేయడానికి నేను ఇక్కడ ఉన్నాను!",
        "en": "Namaste! I'm Swasthya Sahayak, your healthcare assistant. How can I help you today? Tell me your symptoms or which doctor you need, and I'll find the best options near you!"
    }
    lang = (language or "hi")[:2]
    text = greetings.get(lang, greetings["en"])
    emit_event("AGENT_GREETING", "Swasthya Sahayak Greeted User", {"language": lang})
    return {"greeting": text, "language": lang}

# --- Agora Conversational AI Custom LLM Endpoint (OpenAI-compatible) ---
@app.post("/chat/completions")
@app.post("/api/chat/completions")
async def chat_completions(req: Request):
    body = await req.json()
    messages = body.get("messages", [])
    stream = body.get("stream", False)

    lang = "hi"
    user_msgs = [m.get("content", "") for m in messages if m.get("role") == "user"]
    if user_msgs:
        last_txt = user_msgs[-1].lower()
        if any(w in last_txt for w in ["ide", "beku", "nanage", "kannada", "bengaluru"]):
            lang = "kn"
        elif any(w in last_txt for w in ["undi", "kavali", "naaku", "telugu", "hyderabad"]):
            lang = "te"
        elif any(w in last_txt for w in ["english", "doctor", "hospital", "appointment"]):
            lang = "en"

    agent_output = agent_engine.process_conversation(messages, current_lang=lang)
    spoken_text = agent_output["spoken_text"]

    if stream:
        async def event_generator():
            chunk_role = {
                "id": f"chatcmpl-{int(time.time())}",
                "object": "chat.completion.chunk",
                "created": int(time.time()),
                "model": "swasthya-sahayak-agent-v1",
                "choices": [{"index": 0, "delta": {"role": "assistant"}, "finish_reason": None}]
            }
            yield f"data: {json.dumps(chunk_role)}\n\n"

            chunk_content = {
                "id": f"chatcmpl-{int(time.time())}",
                "object": "chat.completion.chunk",
                "created": int(time.time()),
                "model": "swasthya-sahayak-agent-v1",
                "choices": [{"index": 0, "delta": {"content": spoken_text}, "finish_reason": None}]
            }
            yield f"data: {json.dumps(chunk_content)}\n\n"

            chunk_done = {
                "id": f"chatcmpl-{int(time.time())}",
                "object": "chat.completion.chunk",
                "created": int(time.time()),
                "model": "swasthya-sahayak-agent-v1",
                "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}]
            }
            yield f"data: {json.dumps(chunk_done)}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    return {
        "id": f"chatcmpl-{int(time.time())}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": "swasthya-sahayak-agent-v1",
        "choices": [{"index": 0, "message": {"role": "assistant", "content": spoken_text}, "finish_reason": "stop"}],
        "usage": {"prompt_tokens": 50, "completion_tokens": 30, "total_tokens": 80}
    }

# --- Agora Session Management & Join ---
class StartAgentRequest(BaseModel):
    channel_name: str
    language: Optional[str] = "en"
    user_uid: Optional[int] = 1234
    pipeline_id: Optional[str] = "764732387e094ab29c71c37d94d205e7"

@app.post("/api/agora/start-agent")
async def start_agora_agent(req: StartAgentRequest):
    channel = req.channel_name or "swasthya-sahayak-room"
    lang = req.language or "en"
    pipeline_id = req.pipeline_id or settings.AGORA_PIPELINE_ID
    config = get_agora_conversational_ai_config(channel, lang)
    user_token = generate_agora_rtc_token(channel, req.user_uid or 1234)
    
    # Trigger Agora Join REST API
    join_result = await join_agora_conversational_agent(channel, pipeline_id)
    
    emit_event("AGORA_AGENT_STARTED", "Agora Conversational AI Agent Initialized", {
        "channel": channel,
        "language": lang,
        "pipeline_id": pipeline_id,
        "tts_vendor": "Murf AI Falcon 2.1 (Rachna, Conversational)",
        "voice": config["conversational_ai_pipeline"]["tts"]["voice_id"],
        "asr_engine": "Agora Multilingual ASR (Code-mixed capable)",
        "join_status": join_result.get("status")
    })
    return {
        "status": "success",
        "channel_name": channel,
        "user_uid": req.user_uid or 1234,
        "token": user_token,
        "app_id": settings.AGORA_APP_ID,
        "pipeline_id": pipeline_id,
        "config": config,
        "voice_info": MURF_VOICE_MAP.get(lang, MURF_VOICE_MAP["en"]),
        "join_result": join_result
    }

# --- Murf AI Falcon 2.1 Streaming ---
class MurfTTSRequest(BaseModel):
    text: str
    language: Optional[str] = "hi"
    voice_id: Optional[str] = None

@app.post("/api/tts/murf-stream")
async def murf_tts_stream(req: MurfTTSRequest):
    if not settings.MURF_API_KEY.strip():
        return JSONResponse(status_code=200, content={"status": "fallback", "message": "Murf API key not set. Using browser voice."})
    stream_generator = stream_murf_falcon_audio(text=req.text, language=req.language or "hi", voice_id=req.voice_id)
    if stream_generator is None:
        return JSONResponse(status_code=200, content={"status": "fallback"})
    return StreamingResponse(stream_generator, media_type="audio/mpeg")

# --- Agora & Murf Admin Configuration ---
@app.get("/api/agora/config")
def get_agora_config():
    return {
        "app_id": settings.AGORA_APP_ID,
        "has_certificate": bool(settings.AGORA_APP_CERTIFICATE),
        "murf_model": settings.MURF_MODEL,
        "murf_region_url": settings.MURF_REGION_URL,
        "has_murf_key": bool(settings.MURF_API_KEY.strip()),
        "volume_offset": settings.MURF_VOLUME_OFFSET,
        "supported_voices": MURF_VOICE_MAP
    }

class UpdateAgoraMurfRequest(BaseModel):
    agora_app_id: Optional[str] = None
    agora_certificate: Optional[str] = None
    murf_api_key: Optional[str] = None
    murf_region_url: Optional[str] = None
    murf_volume_offset: Optional[int] = None

@app.post("/api/admin/agora-murf/config")
def update_agora_murf(req: UpdateAgoraMurfRequest):
    if req.agora_app_id is not None:
        settings.AGORA_APP_ID = req.agora_app_id.strip()
    if req.agora_certificate is not None:
        settings.AGORA_APP_CERTIFICATE = req.agora_certificate.strip()
    if req.murf_api_key is not None:
        settings.MURF_API_KEY = req.murf_api_key.strip()
    if req.murf_region_url is not None:
        settings.MURF_REGION_URL = req.murf_region_url.strip()
    if req.murf_volume_offset is not None:
        settings.MURF_VOLUME_OFFSET = req.murf_volume_offset
    emit_event("AGORA_MURF_CONFIG_UPDATED", "Agora & Murf Falcon 2.1 Settings Updated", {
        "agora_app_id": settings.AGORA_APP_ID, "has_murf_key": bool(settings.MURF_API_KEY.strip()), "murf_region": settings.MURF_REGION_URL
    })
    return {"status": "success", "config": get_agora_config()}

# --- Voice & Chat Interaction ---
class VoiceInteractionRequest(BaseModel):
    message: str
    language: Optional[str] = "hi"
    history: Optional[List[Dict[str, str]]] = []
    patient_lat: Optional[float] = None
    patient_lng: Optional[float] = None

@app.post("/api/voice/interact")
def voice_interact(req: VoiceInteractionRequest):
    messages = req.history.copy() if req.history else []
    messages.append({"role": "user", "content": req.message})
    result = agent_engine.process_conversation(messages, current_lang=req.language or "hi")
    return {
        "status": "success",
        "spoken_text": result["spoken_text"],
        "tool_calls": result["tool_calls"],
        "speciality": result["speciality"],
        "emergency": result["emergency"],
        "appointment": result.get("appointment"),
        "suggested_doctor": result.get("suggested_doctor")
    }

# --- Doctor Directory & Appointments ---
@app.get("/api/doctors")
def list_doctors(speciality: Optional[str] = None, city: Optional[str] = None, language: Optional[str] = None,
                 patient_lat: Optional[float] = None, patient_lng: Optional[float] = None):
    return {"doctors": search_doctors(speciality, city, language, patient_lat=patient_lat, patient_lng=patient_lng)}

@app.get("/api/doctors/count")
def doctors_count():
    return {"total": len(DOCTORS)}

@app.get("/api/appointments")
def list_appointments():
    return {"appointments": APPOINTMENTS}

@app.get("/api/events")
def list_events():
    return {"events": get_live_events()}

# --- Prescription Scanner ---
class ScanPrescriptionRequest(BaseModel):
    image_url: Optional[str] = None
    language: Optional[str] = "hi"

@app.post("/api/prescription/scan")
def scan_prescription(req: ScanPrescriptionRequest):
    rx = scan_prescription_data(image_url=req.image_url)
    emit_event("PRESCRIPTION_SCANNED", "AI Prescription OCR Scanned & Read", {
        "diagnosis": rx["diagnosis"], "medicines_count": len(rx["medicines"]),
        "reminders": [m["name"] + " (" + ", ".join(m["reminder_times"]) + ")" for m in rx["medicines"]]
    })
    return {"status": "success", "prescription": rx}

@app.get("/api/prescriptions")
def list_prescriptions():
    return {"prescriptions": PRESCRIPTIONS}

# --- Doctor Dashboard ---
@app.get("/api/doctor/queue")
def doctor_queue(doctor_id: Optional[str] = "doc-001"):
    doc = get_doctor_by_id(doctor_id) or DOCTORS[0]
    patients = [a for a in APPOINTMENTS if a.get("doctor_id") == doc["id"]]
    if not patients:
        patients = [{"id": "APT-SAMPLE", "patient_name": "Ravi Kumar", "phone": "+91 98450 12345",
                      "slot": "11:30 AM", "date": "Today", "reason": "Chronic Migraine & Mild Fever",
                      "status": "WAITING_IN_CLINIC", "fee": doc["fee"]}]
    return {"doctor": doc, "queue": patients, "total_today": len(patients) + 4, "completed_today": 3}

class WritePrescriptionRequest(BaseModel):
    doctor_id: str
    patient_name: str
    diagnosis: str
    medicines: List[Dict[str, Any]]

@app.post("/api/doctor/prescribe")
def write_prescription(req: WritePrescriptionRequest):
    rx_id = f"RX-{uuid.uuid4().hex[:5].upper()}"
    new_rx = {
        "id": rx_id, "doctor_id": req.doctor_id,
        "doctor_name": (get_doctor_by_id(req.doctor_id) or DOCTORS[0])["name"],
        "patient_name": req.patient_name, "date": datetime.now().strftime("%Y-%m-%d"),
        "diagnosis": req.diagnosis, "medicines": req.medicines, "created_at": time.time()
    }
    PRESCRIPTIONS.insert(0, new_rx)
    emit_event("PRESCRIPTION_ISSUED", f"Dr. prescribed {len(req.medicines)} medicines for {req.patient_name}", new_rx)
    return {"status": "success", "prescription": new_rx}

@app.get("/api/clinic/directions")
def get_clinic_directions(doctor_id: Optional[str] = "doc-001"):
    doc = get_doctor_by_id(doctor_id) or DOCTORS[0]
    return {
        "doctor_name": doc["name"], "hospital": doc["hospital"],
        "landmark": doc.get("landmark", "Koramangala"),
        "distance": doc.get("distance", "1.2 km away"),
        "travel_time": doc.get("travel_time", "5 mins"),
        "directions": doc.get("map_directions", []),
        "google_maps_url": f"https://www.google.com/maps/search/?api=1&query={doc['hospital'].replace(' ', '+')}+{doc['city']}"
    }

@app.post("/api/reset")
def reset_data():
    APPOINTMENTS.clear()
    get_live_events().clear()
    emit_event("SYSTEM_RESET", "System state refreshed for new demo run", {})
    return {"status": "success"}

# --- Authentication ---
class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth/login")
def login(req: LoginRequest):
    sess = authenticate_user(req.email, req.password)
    if not sess:
        raise HTTPException(status_code=401, detail="Invalid credentials. Use preset demo accounts.")
    emit_event("USER_LOGGED_IN", f"User {sess['user']['name']} ({sess['user']['role']}) logged in", {})
    return sess

class LoginOTPRequest(BaseModel):
    phone: str
    otp: str

@app.post("/api/auth/login-otp")
def login_otp(req: LoginOTPRequest):
    sess = authenticate_by_phone(req.phone, req.otp)
    if not sess:
        raise HTTPException(status_code=401, detail="Invalid phone or OTP. Try demo: +919845012345 / 123456")
    emit_event("USER_LOGGED_IN", f"User {sess['user']['name']} logged in via OTP", {})
    return sess

class LoginGoogleRequest(BaseModel):
    google_id: str = "demo"
    email: str

@app.post("/api/auth/login-google")
def login_google(req: LoginGoogleRequest):
    sess = authenticate_by_google(req.google_id, req.email)
    if not sess:
        raise HTTPException(status_code=401, detail="Google login failed. Use @gmail.com or @bharat.in email.")
    emit_event("USER_LOGGED_IN", f"User {sess['user']['name']} logged in via Google", {})
    return sess

@app.get("/api/auth/demo-users")
def list_demo_users():
    # Return sanitized list (no passwords)
    safe = []
    for u in DEMO_USERS:
        safe.append({
            "name": u["name"], "role": u["role"], "role_label": u["role_label"],
            "email": u.get("email", ""), "phone": u.get("phone", ""),
            "city": u.get("city", ""), "avatar": u["avatar"]
        })
    return {"users": safe}

# --- Admin Model Management & RL ---
@app.get("/api/admin/models")
def get_admin_models():
    return {"providers": model_router.get_providers()}

class UpdateProvidersRequest(BaseModel):
    providers: List[Dict[str, Any]]

@app.post("/api/admin/models/config")
def update_admin_models(req: UpdateProvidersRequest):
    return {"status": "success", "providers": model_router.update_providers(req.providers)}

class TestModelRequest(BaseModel):
    provider_id: str

@app.post("/api/admin/models/test")
def test_admin_model(req: TestModelRequest):
    return model_router.test_provider_health(req.provider_id)

class FeedbackRequest(BaseModel):
    provider_id: str
    rating: float
    latency_ms: Optional[float] = 200.0
    success: Optional[bool] = True

@app.post("/api/feedback/rate")
def submit_feedback(req: FeedbackRequest):
    rl_learner.record_feedback(provider_id=req.provider_id, rating=req.rating,
                               latency_ms=req.latency_ms or 200.0, success=req.success if req.success is not None else True)
    return {"status": "success", "stats": rl_learner.get_stats()}

@app.get("/api/admin/rl-stats")
def get_rl_stats():
    return {"stats": rl_learner.get_stats()}

# --- 1-Click Judge Demo Scenarios ---
class DemoScenarioRequest(BaseModel):
    scenario_id: str

@app.post("/api/demo/run-scenario")
def run_demo_scenario(req: DemoScenarioRequest):
    sid = req.scenario_id
    if sid == "hindi_headache":
        user_utterance = "Mujhe kal se bahut tej sar dard hai, Bengaluru mein koi accha doctor batao"
        lang = "hi"
        res1 = agent_engine.process_conversation([{"role": "user", "content": user_utterance}], current_lang=lang)
        user_confirm = "Haan, kal subah 11:30 baje ka slot book kar dijiye"
        res2 = agent_engine.process_conversation([
            {"role": "user", "content": user_utterance},
            {"role": "assistant", "content": res1["spoken_text"]},
            {"role": "user", "content": user_confirm}
        ], current_lang=lang)
        return {
            "scenario": "Hindi / Hinglish Headache in Bengaluru", "lang": "hi",
            "steps": [
                {"speaker": "User (Hinglish)", "text": user_utterance},
                {"speaker": "Swasthya Sahayak (Murf Hindi)", "text": res1["spoken_text"]},
                {"speaker": "User", "text": user_confirm},
                {"speaker": "Swasthya Sahayak (Confirmation)", "text": res2["spoken_text"]}
            ],
            "appointment": res2.get("appointment")
        }
    elif sid == "kannada_fever":
        user_utterance = "Nanage eradu dinadinda jvara ide, Bengaluru alli doctor beku"
        lang = "kn"
        res1 = agent_engine.process_conversation([{"role": "user", "content": user_utterance}], current_lang=lang)
        user_confirm = "Haudu, 11:30 gantege appointment book maadi"
        res2 = agent_engine.process_conversation([
            {"role": "user", "content": user_utterance},
            {"role": "assistant", "content": res1["spoken_text"]},
            {"role": "user", "content": user_confirm}
        ], current_lang=lang)
        return {
            "scenario": "Kannada Fever Consultation in Bengaluru", "lang": "kn",
            "steps": [
                {"speaker": "User (Kannada)", "text": user_utterance},
                {"speaker": "Swasthya Sahayak (Murf Kannada)", "text": res1["spoken_text"]},
                {"speaker": "User", "text": user_confirm},
                {"speaker": "Swasthya Sahayak (Confirmation)", "text": res2["spoken_text"]}
            ],
            "appointment": res2.get("appointment")
        }
    elif sid == "telugu_consult":
        user_utterance = "Naaku thalanoppiga undi, Hyderabad lo manchi doctor evaru unnaru?"
        lang = "te"
        res1 = agent_engine.process_conversation([{"role": "user", "content": user_utterance}], current_lang=lang)
        user_confirm = "Avunu, repu 11:30 ki slot confirm cheyandi"
        res2 = agent_engine.process_conversation([
            {"role": "user", "content": user_utterance},
            {"role": "assistant", "content": res1["spoken_text"]},
            {"role": "user", "content": user_confirm}
        ], current_lang=lang)
        return {
            "scenario": "Telugu Neurologist in Hyderabad", "lang": "te",
            "steps": [
                {"speaker": "User (Telugu)", "text": user_utterance},
                {"speaker": "Swasthya Sahayak (Murf Telugu)", "text": res1["spoken_text"]},
                {"speaker": "User", "text": user_confirm},
                {"speaker": "Swasthya Sahayak (Confirmation)", "text": res2["spoken_text"]}
            ],
            "appointment": res2.get("appointment")
        }
    elif sid == "emergency_alert":
        user_utterance = "Chhati mein bahut tezz dard ho raha hai aur saans lene me dikkat hai"
        lang = "hi"
        res1 = agent_engine.process_conversation([{"role": "user", "content": user_utterance}], current_lang=lang)
        return {
            "scenario": "Critical Emergency 108 Guardrail", "lang": "hi",
            "steps": [
                {"speaker": "User", "text": user_utterance},
                {"speaker": "Emergency Guardrail System", "text": res1["spoken_text"]}
            ],
            "is_emergency": True
        }
    else:
        user_utterance = "I need to consult a general physician tomorrow in Bengaluru"
        lang = "en"
        res1 = agent_engine.process_conversation([{"role": "user", "content": user_utterance}], current_lang=lang)
        user_confirm = "Yes please confirm the 11:30 AM appointment"
        res2 = agent_engine.process_conversation([
            {"role": "user", "content": user_utterance},
            {"role": "assistant", "content": res1["spoken_text"]},
            {"role": "user", "content": user_confirm}
        ], current_lang=lang)
        return {
            "scenario": "Indian English Consultation", "lang": "en",
            "steps": [
                {"speaker": "User", "text": user_utterance},
                {"speaker": "Swasthya Sahayak", "text": res1["spoken_text"]},
                {"speaker": "User", "text": user_confirm},
                {"speaker": "Swasthya Sahayak", "text": res2["spoken_text"]}
            ],
            "appointment": res2.get("appointment")
        }
