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
            phone=arguments.get("phone", "+91 98765 43210"),
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
    Hindi, Hinglish, Kannada, Telugu, and Indian English.
    Handles RAG symptom triage, tool calls, and natural spoken responses.
    Greets user on first interaction and then assists.
    """

    def _core_clinical_reasoning(self, messages: List[Dict[str, str]], current_lang: str = "hi",
                                 patient_lat: float = None, patient_lng: float = None) -> Dict[str, Any]:
        user_messages = [m["content"] for m in messages if m.get("role") == "user"]
        last_user_text = user_messages[-1] if user_messages else ""
        conversation_history_text = " ".join(user_messages).lower()

        # ─── GREETING: If no user messages or first message is a greeting ───
        if not user_messages or not last_user_text.strip():
            greetings = {
                "hi": "Namaste! Main Swasthya Sahayak hoon, aapka healthcare assistant. Aap mujhe Hindi ya Hinglish mein bata sakte hain — aapko kya takleef hai ya kis doctor se milna hai? Main aapki madad ke liye yahan hoon!",
                "kn": "ನಮಸ್ಕಾರ! ನಾನು ಸ್ವಾಸ್ಥ್ಯ ಸಹಾಯಕ, ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಹಾಯಕ. ನಿಮಗೆ ಏನು ತೊಂದರೆ ಇದೆ ಅಥವಾ ಯಾವ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಬೇಕು ಎಂದು ಹೇಳಿ. ನಾನು ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ!",
                "te": "నమస్కారం! నేను స్వాస్థ్య సహాయక్, మీ హెల్త్‌కేర్ అసిస్టెంట్. మీకు ఏ సమస్య ఉంది లేదా ఏ డాక్టర్‌ను కలవాలో చెప్పండి. మీకు సహాయం చేయడానికి నేను ఇక్కడ ఉన్నాను!",
                "en": "Namaste! I'm Swasthya Sahayak, your healthcare assistant. How can I help you today? You can tell me your symptoms or which doctor you'd like to visit, and I'll find the best options near you!"
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

        # Check if user is just greeting back
        greeting_words = ["hello", "hi", "hey", "namaste", "namaskar", "hola", "good morning", "good evening",
                          "help", "madad", "sahayata", "kya kar sakte ho"]
        if last_user_text.strip().lower() in greeting_words or (len(last_user_text.split()) <= 3 and any(g in last_user_text.lower() for g in greeting_words)):
            greetings = {
                "hi": "Namaste! Main aapka Swasthya Sahayak hoon. Aap mujhe batayein — kya takleef hai, kahan dard ho raha hai, ya kisi doctor se milna hai? Main turant aapke paas ke best doctor dhundh kar appointment book kar sakta hoon!",
                "kn": "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಸ್ವಾಸ್ಥ್ಯ ಸಹಾಯಕ. ನಿಮಗೆ ಏನು ತೊಂದರೆ ಇದೆ ಎಂದು ಹೇಳಿ — ನಾನು ಹತ್ತಿರದ ಉತ್ತಮ ವೈದ್ಯರನ್ನು ಹುಡುಕಿ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡುತ್ತೇನೆ!",
                "te": "నమస్కారం! నేను మీ స్వాస్థ్య సహాయక్. మీకు ఏ సమస్య ఉందో చెప్పండి — నేను దగ్గరలోని మంచి డాక్టర్‌ను కనుగొని అపాయింట్‌మెంట్ బుక్ చేస్తాను!",
                "en": "Hello! I'm your Swasthya Sahayak. Tell me — what's troubling you, where does it hurt, or which specialist do you need? I'll find the best nearby doctor and book your appointment instantly!"
            }
            emit_event(
                event_type="AGENT_GREETING",
                title="Swasthya Sahayak Responded to Greeting",
                details={"language": current_lang, "type": "greeting_response"}
            )
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

        # 2. Extract context: city, speciality, booking confirmation
        detected_city = "Bengaluru"  # default
        if "hyderabad" in conversation_history_text:
            detected_city = "Hyderabad"
        elif "delhi" in conversation_history_text:
            detected_city = "Delhi"
        elif "mumbai" in conversation_history_text:
            detected_city = "Mumbai"

        # Check if user says "haan", "yes", "book kardo", etc -> Confirm booking!
        wants_to_confirm = any(kw in last_user_text.lower() for kw in [
            "haan", "yes", "confirm", "book", "ha", "theek", "hawn", "okay", "sari", "haudu", "avunu", "chesi"
        ])

        # Step 3: Agentic Flow State
        if wants_to_confirm and ("11" in conversation_history_text or "slot" in conversation_history_text or "doctor" in conversation_history_text):
            docs = search_doctors(detected_speciality, detected_city, current_lang)
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
                "hi": f"Aapka appointment {chosen_doc['name']} ke sath kal subah 11:30 baje book ho gaya hai. SMS confirmation aur reminder bhej diya gaya hai.",
                "kn": f"{chosen_doc['name']} ಅವರೊಂದಿಗೆ ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ನಾಳೆ ಬೆಳಗ್ಗೆ 11:30 ಕ್ಕೆ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ. ಎಸ್‌ಎಂಎಸ್ ಕಳುಹಿಸಲಾಗಿದೆ.",
                "te": f"{chosen_doc['name']} గారితో మీ అపాయింట్‌మెంట్ రేపు ఉదయం 11:30 గంటలకు ఖరారైంది. వివరాలు మెసేజ్ ద్వారా పంపబడ్డాయి.",
                "en": f"Your appointment with {chosen_doc['name']} has been confirmed for tomorrow at 11:30 AM. Confirmation SMS and reminders have been queued."
            }

            return {
                "spoken_text": spoken_confirmations.get(current_lang, spoken_confirmations["en"]),
                "tool_calls": [{"name": "book_appointment", "args": tool_args, "result": booking_res}],
                "speciality": detected_speciality,
                "emergency": False,
                "appointment": appt
            }

        # Otherwise, user is stating symptom or asking for doctor
        docs = search_doctors(speciality=detected_speciality, city=detected_city, language=current_lang, disease_query=last_user_text)
        chosen_doc = docs[0] if docs else DOCTORS[0]
        execute_tool_call("search_doctors", {
            "speciality": detected_speciality,
            "city": detected_city,
            "language": current_lang,
            "matched_disease": last_user_text,
            "nearby_distance": chosen_doc.get("distance", "1.2 km away"),
            "why_best": chosen_doc.get("why_best", [])[:2]
        }, current_lang)

        slots = get_slots(chosen_doc["id"])
        execute_tool_call("get_slots", {"doctor_id": chosen_doc["id"]}, current_lang)

        spoken_recommendations = {
            "hi": f"{detected_city} mein {chosen_doc.get('distance', 'paas mein')} {chosen_doc['name']} ({chosen_doc.get('degrees', '')}) uplabdh hain. Inhe {chosen_doc.get('rating', 4.9)} star rating mili hai. Kal subah 11:30 baje ka slot khali hai. Kya main book kar doon?",
            "kn": f"{detected_city} ನಲ್ಲಿ {chosen_doc.get('distance', 'ಹತ್ತಿರದಲ್ಲಿ')} {chosen_doc['name']} ({chosen_doc.get('rating', 4.9)}★) ಲಭ್ಯವಿದ್ದಾರೆ. ನಾಳೆ ಬೆಳಗ್ಗೆ 11:30 ರ ಸ್ಲಾಟ್ ಖಾಲಿ ಇದೆ. ಬುಕ್ ಮಾಡಲೇ?",
            "te": f"{detected_city} లో {chosen_doc.get('distance', 'దగ్గరలో')} {chosen_doc['name']} ({chosen_doc.get('rating', 4.95)}★) అందుబాటులో ఉన్నారు. రేపు ఉదయం 11:30 కి స్లాట్ ఉంది. బుక్ చేయమంటారా?",
            "en": f"In {detected_city}, just {chosen_doc.get('distance', 'nearby')} at {chosen_doc['hospital']}, {chosen_doc['name']} ({chosen_doc.get('rating', 4.9)}★) is available. Tomorrow at 11:30 AM has an open slot. Shall I confirm this booking?"
        }

        return {
            "spoken_text": spoken_recommendations.get(current_lang, spoken_recommendations["en"]),
            "tool_calls": [
                {"name": "search_doctors", "args": {"speciality": detected_speciality, "city": detected_city}},
                {"name": "get_slots", "args": {"doctor_id": chosen_doc["id"]}}
            ],
            "speciality": detected_speciality,
            "emergency": False,
            "suggested_doctor": chosen_doc
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
