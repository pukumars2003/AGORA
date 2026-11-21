import json
from typing import List, Dict, Any, Tuple
from database import search_doctors, get_slots, book_appointment_record, DOCTORS, get_doctor_by_id
from symptom_rag import analyze_symptoms_and_triage
from scheduler_service import emit_event, schedule_appointment_reminders_and_followup

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "search_doctors",
            "description": "Find verified doctors by speciality, city, and preferred language",
            "parameters": {
                "type": "object",
                "properties": {
                    "speciality": {"type": "string", "description": "e.g. Neurologist, General Physician, Pediatrician"},
                    "city": {"type": "string", "description": "City name, e.g. Bengaluru, Hyderabad, Delhi, Mumbai"},
                    "language": {"type": "string", "description": "hi, kn, te, or en"}
                },
                "required": ["speciality", "city"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_slots",
            "description": "Get available appointment time slots for a doctor",
            "parameters": {
                "type": "object",
                "properties": {
                    "doctor_id": {"type": "string", "description": "Doctor ID, e.g. doc-001"},
                    "date": {"type": "string", "description": "Appointment date YYYY-MM-DD"}
                },
                "required": ["doctor_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "book_appointment",
            "description": "Confirm and book the appointment after user's explicit spoken approval",
            "parameters": {
                "type": "object",
                "properties": {
                    "doctor_id": {"type": "string", "description": "Doctor ID to book"},
                    "slot": {"type": "string", "description": "Chosen time slot like 11:30 AM"},
                    "patient_name": {"type": "string", "description": "Full name of the patient"},
                    "phone": {"type": "string", "description": "Contact phone number for SMS & reminders"},
                    "reason": {"type": "string", "description": "Brief health symptom or reason"}
                },
                "required": ["doctor_id", "slot", "patient_name", "phone"]
            }
        }
    }
]

def execute_tool_call(tool_name: str, arguments: Dict[str, Any], current_lang: str = "hi") -> Dict[str, Any]:
    emit_event(
        event_type="TOOL_CALLED",
        title=f"AI Agent executing tool: {tool_name}",
        details={"tool": tool_name, "arguments": arguments}
    )

    if tool_name == "search_doctors":
        results = search_doctors(
            speciality=arguments.get("speciality"),
            city=arguments.get("city"),
            language=arguments.get("language", current_lang),
            patient_lat=arguments.get("patient_lat"),
            patient_lng=arguments.get("patient_lng"),
        )
        emit_event(
            event_type="TOOL_COMPLETED",
            title=f"Found {len(results)} doctor(s)",
            details={"doctors": [d["name"] + " (" + d["hospital"] + ")" for d in results]}
        )
        return {"status": "success", "doctors": results}

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
    Natural spoken conversational responses with zero emojis and proper phonetics.
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
                "hi": "Namaste! Aap batayein kya takleef hai, sar dard, bukhar ya koi aur samasya? Main turant paas ke best doctors suggest kar doonga.",
                "kn": "Namaskara! Nimage tale novu, jwara athava enu problem ide heli. Naanu nearby best doctors na suggest maadthene.",
                "te": "Namaskaram! Meeku thalanoppi, jwaram leda em problem undo cheppandi. Nenu daggara unna best doctors ni suggest chesthanu.",
                "en": "Hello! Please tell me what health issue you are experiencing, and I will recommend the best available doctors near you."
            }
            return {
                "spoken_text": greetings.get(current_lang, greetings["en"]),
                "tool_calls": [],
                "speciality": None,
                "emergency": False
            }

        # 1. RAG & Emergency Triage Check
        is_emergency, detected_speciality, guidance_msg, code_mix_flavor = analyze_symptoms_and_triage(
            last_user_text, current_lang
        )

        emit_event(
            event_type="NLU_UNDERSTAND",
            title=f"Intent Analyzed: {code_mix_flavor}",
            details={
                "user_utterance": last_user_text,
                "detected_speciality": detected_speciality,
                "is_emergency": is_emergency,
                "code_mixed_type": code_mix_flavor
            }
        )

        if is_emergency:
            return {
                "spoken_text": guidance_msg,
                "tool_calls": [],
                "speciality": "Emergency",
                "emergency": True
            }

        # 2. Extract city context
        detected_city = "Bengaluru"
        if "hyderabad" in conversation_history_text:
            detected_city = "Hyderabad"
        elif "delhi" in conversation_history_text:
            detected_city = "Delhi"
        elif "mumbai" in conversation_history_text:
            detected_city = "Mumbai"

        # 3. Detect booking confirmation intent
        # Supports Hinglish, Kannada/HinKannada ("haudu", "book maadi", "maadi", "sari"), Telugu, English
        wants_to_confirm = any(kw in last_user_text.lower() for kw in [
            "haan", "yes", "confirm", "book", "ha", "theek", "hawn", "okay", "sari", 
            "haudu", "avunu", "chesi", "maadi", "book maadi", "book kardo", "slot book", "kar do"
        ])

        # Step 3A: USER CONFIRMS BOOKING
        if wants_to_confirm:
            docs = search_doctors(detected_speciality, detected_city, current_lang, patient_lat=patient_lat, patient_lng=patient_lng)
            chosen_doc = docs[0] if docs else DOCTORS[0]
            slot = "11:30 AM"

            tool_args = {
                "doctor_id": chosen_doc["id"],
                "slot": slot,
                "patient_name": "Ravi Kumar",
                "phone": "+91 98450 12345",
                "reason": detected_speciality
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
                "speciality": detected_speciality,
                "emergency": False,
                "appointment": appt
            }

        # Step 3B: USER ASKS FOR DOCTORS / SYMPTOMS -> RETURN MULTIPLE SUGGESTIONS (TOP 3)
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
        second_doc = top_docs[1] if len(top_docs) > 1 else None

        execute_tool_call("search_doctors", {
            "speciality": detected_speciality,
            "city": detected_city,
            "language": current_lang,
            "matched_disease": last_user_text,
            "nearby_distance": chosen_doc.get("distance", "1 km away")
        }, current_lang)

        execute_tool_call("get_slots", {"doctor_id": chosen_doc["id"]}, current_lang)

        # Multi-doctor spoken recommendation in native phonetic code-mixed format (no broken Kannada TTS)
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
