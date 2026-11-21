from typing import List, Dict, Any, Optional
import time
import uuid
import re
from config import settings
from database import (
    DOCTORS, APPOINTMENTS, PRESCRIPTIONS,
    search_doctors, get_slots, book_appointment_record
)
from symptom_rag import analyze_symptoms_and_triage, SYMPTOM_MAP
from scheduler_service import emit_event, schedule_appointment_reminders_and_followup

TOOL_DEFINITIONS = [
    {
        "name": "search_doctors",
        "description": "Searches for doctors based on medical speciality, location, language preference, and nearby distance.",
        "parameters": {
            "type": "object",
            "properties": {
                "speciality": {"type": "string", "description": "Medical speciality (e.g. Neurologist, General Physician)"},
                "city": {"type": "string", "description": "City name (e.g. Bengaluru, Hyderabad, Delhi, Mumbai)"},
                "language": {"type": "string", "description": "Preferred language (hi, kn, te, en)"}
            },
            "required": ["speciality"]
        }
    },
    {
        "name": "get_slots",
        "description": "Retrieves available consultation slots for a specific doctor.",
        "parameters": {
            "type": "object",
            "properties": {
                "doctor_id": {"type": "string", "description": "ID of the doctor"},
                "date": {"type": "string", "description": "Consultation date (YYYY-MM-DD)"}
            },
            "required": ["doctor_id"]
        }
    },
    {
        "name": "book_appointment",
        "description": "Confirms and books a consultation appointment with the doctor.",
        "parameters": {
            "type": "object",
            "properties": {
                "doctor_id": {"type": "string", "description": "ID of the doctor"},
                "slot": {"type": "string", "description": "Confirmed slot time (e.g. 11:30 AM)"},
                "patient_name": {"type": "string", "description": "Patient's full name"},
                "phone": {"type": "string", "description": "Patient's phone number"},
                "reason": {"type": "string", "description": "Primary complaint / symptom"}
            },
            "required": ["doctor_id", "slot", "patient_name", "phone"]
        }
    }
]

def execute_tool_call(tool_name: str, arguments: Dict[str, Any], current_lang: str = "hi") -> Dict[str, Any]:
    """Simulates real execution of backend tools and emits live timeline events."""
    if tool_name == "search_doctors":
        speciality = arguments.get("speciality", "General Physician")
        city = arguments.get("city", "Bengaluru")
        docs = search_doctors(speciality=speciality, city=city, language=current_lang)
        emit_event(
            event_type="TOOL_COMPLETED",
            title=f"Doctor Search: {speciality} in {city}",
            details={"found_count": len(docs), "matched": [d["name"] for d in docs[:3]]}
        )
        return {"status": "success", "doctors": docs}

    elif tool_name == "get_slots":
        slots = get_slots(
            doctor_id=arguments.get("doctor_id", "doc-001"),
            date=arguments.get("date")
        )
        emit_event(
            event_type="TOOL_COMPLETED",
            title="Retrieved Available Slots",
            details={"slots": slots}
        )
        return {"status": "success", "available_slots": slots}

    elif tool_name == "book_appointment":
        booking = book_appointment_record(
            doctor_id=arguments.get("doctor_id", "doc-001"),
            slot=arguments.get("slot", "11:30 AM"),
            patient_name=arguments.get("patient_name", "Ravi Kumar"),
            phone=arguments.get("phone", "+91 98450 12345"),
            reason=arguments.get("reason", "Consultation"),
            language=current_lang
        )
        schedule_appointment_reminders_and_followup(booking)
        emit_event(
            event_type="APPOINTMENT_BOOKED",
            title=f"Appointment Confirmed: {booking['id']}",
            details=booking
        )
        return {"status": "success", "appointment": booking}

    return {"status": "error", "message": f"Unknown tool: {tool_name}"}

class MultilingualAgentEngine:
    """
    Intelligent Agent Engine that supports Indian languages:
    Hindi / Hinglish, Kannada / HinKannada, Telugu / Telugish, and Indian English.
    Includes clinical intake guardrails:
    - Never books without explicit confirmation on a previously recommended doctor.
    - Asks duration & emergency red flags (ambulance need) before booking.
    - Handles vague or non-medical inputs gracefully.
    """

    def _core_clinical_reasoning(self, messages: List[Dict[str, str]], current_lang: str = "hi",
                                 patient_lat: float = None, patient_lng: float = None) -> Dict[str, Any]:
        user_messages = [m["content"] for m in messages if m.get("role") == "user"]
        last_user_text = user_messages[-1] if user_messages else ""
        conversation_history_text = " ".join([m.get("content", "") for m in messages]).lower()

        # ─── GREETING: If no user messages or greeting ───
        if not user_messages or not last_user_text.strip():
            greetings = {
                "hi": "Namaste! Main Swasthya Sahayak hoon, aapka healthcare assistant. Aapko kya takleef hai ya kis doctor se milna hai? Main aapki madad ke liye yahan hoon.",
                "kn": "Namaskara! Naanu nimma Swasthya Sahayak. Nimage yaava doctor consult maadbheku athava enu health problem ide? Naanu help maadthene.",
                "te": "Namaskaram! Nenu mee Swasthya Sahayak healthcare assistant ni. Meeku em problem undi leda ye doctor ni kalavali? Nenu help chesthanu.",
                "en": "Hello, I am Swasthya Sahayak, your healthcare assistant. How can I help you today? Please tell me your symptoms or the specialist you would like to consult."
            }
            emit_event(
                event_type="AGENT_GREETING",
                title="Swasthya Sahayak Greeted User",
                details={"language": current_lang, "type": "welcome_greeting"}
            )
            return {
                "spoken_text": greetings.get(current_lang, greetings["en"]),
                "tool_calls": [],
                "speciality": None,
                "emergency": False
            }

        greeting_words = ["hello", "hi", "hey", "namaste", "namaskar", "good morning", "good evening", "help"]
        if last_user_text.strip().lower() in greeting_words:
            greetings = {
                "hi": "Namaste! Aap batayein kya takleef hai — sar dard, bukhar, pet dard ya koi aur samasya? Main turant paas ke best doctors suggest kar doonga.",
                "kn": "Namaskara! Nimage tale novu, jwara, hotte novu athava enu problem ide heli. Naanu nearby best doctors na suggest maadthene.",
                "te": "Namaskaram! Meeku thalanoppi, jwaram, kadupu noppi leda em problem undo cheppandi. Nenu daggara unna best doctors ni suggest chesthanu.",
                "en": "Hello! Please tell me what health symptoms you are experiencing — like headache, fever, stomach pain, or cold. I will recommend the best available doctors near you."
            }
            return {
                "spoken_text": greetings.get(current_lang, greetings["en"]),
                "tool_calls": [],
                "speciality": None,
                "emergency": False
            }

        # 1. RAG & Emergency Triage Check
        is_emergency, detected_speciality, guidance_msg, code_mix_flavor, has_duration, matched_symptom = analyze_symptoms_and_triage(
            last_user_text, current_lang
        )

        emit_event(
            event_type="NLU_UNDERSTAND",
            title=f"Intent Analyzed: {code_mix_flavor}",
            details={
                "user_utterance": last_user_text,
                "detected_speciality": detected_speciality,
                "is_emergency": is_emergency,
                "has_duration": has_duration,
                "matched_symptom": matched_symptom
            }
        )

        # 2. EMERGENCY GUARDRAIL
        if is_emergency:
            return {
                "spoken_text": guidance_msg,
                "tool_calls": [],
                "speciality": "Emergency",
                "emergency": True
            }

        # 3. Extract city context
        detected_city = "Bengaluru"
        if "hyderabad" in conversation_history_text:
            detected_city = "Hyderabad"
        elif "delhi" in conversation_history_text:
            detected_city = "Delhi"
        elif "mumbai" in conversation_history_text:
            detected_city = "Mumbai"

        # 4. Strict Booking Confirmation Guardrail
        # ONLY confirm if user explicitly uses confirmation words AND assistant previously proposed a doctor/slot!
        confirm_pattern = r'\b(haan|haudu|avunu|yes|confirm|book|theek hai|sari|maadi|kardo|kar do)\b'
        has_confirm_keyword = bool(re.search(confirm_pattern, last_user_text.lower()))

        assistant_messages = [m.get("content", "") for m in messages if m.get("role") == "assistant"]
        has_doctor_recommended = any(
            any(w in m.lower() for w in ["recommend", "slot", "available", "suggest", "doctor"]) 
            for m in assistant_messages
        )

        wants_to_confirm = has_confirm_keyword and (
            has_doctor_recommended or 
            bool(re.search(r'\b(book slot|book appointment|confirm slot|confirm appointment|haudu book maadi|haan book kar do)\b', last_user_text.lower()))
        )

        # Step 4A: USER CONFIRMS BOOKING (Only after a doctor was proposed)
        if wants_to_confirm:
            # Fallback to General Physician if speciality wasn't set
            target_spec = detected_speciality or "General Physician"
            for spec in SYMPTOM_MAP.keys():
                if spec.lower() in conversation_history_text:
                    target_spec = spec
                    break

            docs = search_doctors(target_spec, detected_city, current_lang, patient_lat=patient_lat, patient_lng=patient_lng)
            chosen_doc = docs[0] if docs else DOCTORS[0]
            slot = "11:30 AM"

            tool_args = {
                "doctor_id": chosen_doc["id"],
                "slot": slot,
                "patient_name": "Ravi Kumar",
                "phone": "+91 98450 12345",
                "reason": target_spec
            }
            booking_res = execute_tool_call("book_appointment", tool_args, current_lang)
            appt = booking_res.get("appointment", {})

            spoken_confirmations = {
                "hi": f"Aapka appointment {chosen_doc['name']} ke sath kal subah 11:30 baje confirm ho gaya hai. SMS confirmation aur clinic route bhej diya gaya hai.",
                "kn": f"Nimma appointment {chosen_doc['name']} jothe naale belagge 11:30 AM ge confirm aagide. SMS confirmation mathu clinic route details send maadlaagide.",
                "te": f"Mee appointment {chosen_doc['name']} garitho repu podduna 11:30 AM ki confirm ayindi. SMS confirmation and clinic route details pampam.",
                "en": f"Your appointment with {chosen_doc['name']} has been confirmed for tomorrow at 11:30 AM. SMS confirmation and clinic directions have been dispatched."
            }

            return {
                "spoken_text": spoken_confirmations.get(current_lang, spoken_confirmations["en"]),
                "tool_calls": [{"name": "book_appointment", "args": tool_args, "result": booking_res}],
                "speciality": target_spec,
                "emergency": False,
                "appointment": appt
            }

        # Step 4B: HANDLE UNCLEAR / VAGUE INPUT WITHOUT MEDICAL SYMPTOMS
        # (e.g. "Hello I have an attempt", "Testing", "What can you do", "Help me")
        if not detected_speciality:
            # Check if conversation history has symptoms previously mentioned
            for spec, data in SYMPTOM_MAP.items():
                for kw in data["keywords"]:
                    if re.search(r'\b' + re.escape(kw) + r'\b', conversation_history_text):
                        detected_speciality = spec
                        matched_symptom = data["symptom_name"].get(current_lang, data["symptom_name"]["en"])
                        break
                if detected_speciality:
                    break

        if not detected_speciality:
            unclear_prompts = {
                "hi": "Main samajh nahi paaya. Kripya batayein aapko kya takleef ya bimari hai — jaise sar dard, bukhar, pet dard ya sardi? Main sahi specialist suggest karunga.",
                "kn": "Nimage yaava reethiya aarogya samasye ide heli — tale novu, jwara, hotte novu athava kemmu ideya? Naanu nimage sahi doctor suggest maadthene.",
                "te": "Meeku em arogya samasya undo cheppandi — thalanoppi, jwaram, kadupu noppi leda dagguda? Nenu meeku saraina doctor ni suggest chesthanu.",
                "en": "I couldn't identify the health symptom from that. Could you please describe what discomfort or condition you have — such as headache, fever, stomach ache, or cough?"
            }
            return {
                "spoken_text": unclear_prompts.get(current_lang, unclear_prompts["en"]),
                "tool_calls": [],
                "speciality": None,
                "emergency": False
            }

        # Step 4C: CLINICAL INTAKE TRIAGE (If symptom is identified but duration is missing)
        # Ask how many days and check if they need emergency/ambulance!
        is_first_symptom_turn = not any("kitne dino" in m.lower() or "eshtu dinadinda" in m.lower() or "how many days" in m.lower() or "enni rojula" in m.lower() for m in assistant_messages)
        
        # If user explicitly asks for doctor / appointment ("doctor beku", "need doctor", "doctor dikhao"), skip straight to recommendations
        user_wants_doctor_now = any(w in last_user_text.lower() for w in ["doctor", "appointment", "clinic", "hospital", "specialist"])

        if is_first_symptom_turn and not has_duration and not user_wants_doctor_now:
            triage_questions = {
                "hi": f"Aapko {matched_symptom or 'yeh takleef'} kitne dino se ho rahi hai? Aur kya koi emergency jaise saans lene me dikkat ya chhati me dard hai jiske liye ambulance chahiye?",
                "kn": f"Nimage {matched_symptom or 'ee samasye'} eshtu dinadinda ide? Mathu usirata kasta athava ede novu thara emergency lakshana ideya, ambulance beka?",
                "te": f"Meeku {matched_symptom or 'ee samasya'} enni rojula nundi undi? Mariyu oopiri aadakapovadam leda gunde noppi vanti emergency symptoms unnaya, ambulance avasarama?",
                "en": f"I understand you are experiencing {matched_symptom or 'this symptom'}. Since how many days have you had this? Also, do you have any severe symptoms like breathing difficulty or chest pain, or need an emergency ambulance?"
            }
            return {
                "spoken_text": triage_questions.get(current_lang, triage_questions["en"]),
                "tool_calls": [{"name": "clinical_triage", "args": {"symptom": matched_symptom, "speciality": detected_speciality}}],
                "speciality": detected_speciality,
                "emergency": False
            }

        # Step 4D: SYMPTOMS & CONTEXT KNOWN -> RETURN MULTIPLE DOCTOR RECOMMENDATIONS
        docs = search_doctors(
            speciality=detected_speciality,
            city=detected_city,
            language=current_lang,
            disease_query=last_user_text,
            patient_lat=patient_lat,
            patient_lng=patient_lng
        )
        
        if not docs:
            docs = DOCTORS[:3]
        top_docs = docs[:3]
        chosen_doc = top_docs[0]

        execute_tool_call("search_doctors", {
            "speciality": detected_speciality,
            "city": detected_city,
            "language": current_lang,
            "matched_disease": last_user_text,
            "nearby_distance": chosen_doc.get("distance", "1 km away")
        }, current_lang)

        execute_tool_call("get_slots", {"doctor_id": chosen_doc["id"]}, current_lang)

        dist1 = chosen_doc.get('distance_km', 1.0)
        hosp = chosen_doc.get('hospital', 'Clinic')

        spoken_recommendations = {
            "hi": f"Maine aapke liye screen par top nearby doctors dikha diye hain. Main aapko {chosen_doc['name']} ({chosen_doc.get('degrees', '')}) recommend karta hoon jo sirf {dist1} kilometer door {hosp} me hain. Inka kal subah 11:30 AM ka slot khali hai. Kya main confirm kar doon?",
            "kn": f"Naanu nimage screen mele top nearby doctors list kottiddini. Naanu nimage {chosen_doc['name']} na recommend maadthene, avaru {hosp} alli {dist1} kilometer distance alli iddaare. Naale 11:30 AM slot ide. Book maadla?",
            "te": f"Nenu mee kosam screen meeda top nearby doctors ni chupinchanu. Nenu meeku {chosen_doc['name']} ni recommend chesthunnanu, {hosp} lo {dist1} kilometers distance lo unnaru. Repu 11:30 AM ki slot undi. Confirm cheyamantira?",
            "en": f"I have listed the top nearby specialists on your screen. I recommend {chosen_doc['name']} ({chosen_doc.get('degrees', '')}) at {hosp}, located just {dist1} kilometers away. An open slot is available tomorrow at 11:30 AM. Shall I confirm this booking for you?"
        }

        return {
            "spoken_text": spoken_recommendations.get(current_lang, spoken_recommendations["en"]),
            "tool_calls": [
                {"name": "search_doctors", "args": {"speciality": detected_speciality, "city": detected_city}},
                {"name": "get_slots", "args": {"doctor_id": chosen_doc["id"]}}
            ],
            "speciality": detected_speciality,
            "emergency": False,
            "suggested_doctor": chosen_doc,
            "suggested_doctors": top_docs
        }

    def process_conversation(self, messages: List[Dict[str, str]], current_lang: str = "hi",
                             patient_lat: float = None, patient_lng: float = None) -> Dict[str, Any]:
        from model_router import model_router
        return model_router.execute_with_fallback(
            messages=messages,
            current_lang=current_lang,
            default_executor_fn=self._core_clinical_reasoning,
            patient_lat=patient_lat,
            patient_lng=patient_lng
        )

agent_engine = MultilingualAgentEngine()
