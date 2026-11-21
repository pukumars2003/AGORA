import threading
import time
from datetime import datetime
from typing import List, Dict, Callable

# Global queue of live workflow events that the frontend listens to
LIVE_EVENTS: List[Dict] = []
_listeners: List[Callable] = []

def emit_event(event_type: str, title: str, details: Dict):
    event = {
        "id": f"evt-{int(time.time() * 1000)}",
        "type": event_type,
        "title": title,
        "details": details,
        "timestamp": datetime.now().strftime("%H:%M:%S")
    }
    LIVE_EVENTS.insert(0, event)
    # Notify listeners if any
    for listener in _listeners:
        try:
            listener(event)
        except Exception:
            pass
    return event

def get_live_events(limit: int = 30) -> List[Dict]:
    return LIVE_EVENTS[:limit]

def schedule_appointment_reminders_and_followup(appointment: Dict):
    """
    Schedules real-time reminder & follow-up sequence.
    For live hackathon demos, we dispatch immediate confirmation,
    then an automated SMS reminder after 12 seconds,
    and a follow-up feedback collector after 25 seconds!
    """
    patient_name = appointment.get("patient_name", "Patient")
    doc_name = appointment.get("doctor_name", "Doctor")
    slot = appointment.get("slot", "11:00 AM")
    phone = appointment.get("phone", "+91 98765 43210")
    hospital = appointment.get("hospital", "Clinic")
    lang = appointment.get("language", "hi")

    # 1. Instant Confirmation Event
    emit_event(
        event_type="CONFIRMATION_DISPATCHED",
        title="SMS & WhatsApp Confirmation Sent",
        details={
            "recipient": phone,
            "channel": "WhatsApp / SMS Gateway",
            "message": f"Namaste {patient_name}, your appointment with {doc_name} is confirmed for tomorrow at {slot} at {hospital}. Ref: {appointment['id']}.",
            "status": "DELIVERED",
            "delay_secs": 0
        }
    )

    # 2. Simulated Pre-visit Reminder (fires at T+12s for the demo)
    def trigger_reminder():
        reminder_texts = {
            "hi": f"Namaste {patient_name}! Swasthya Sahayak reminder: Aapki appointment {doc_name} ke sath {slot} baje hai ({hospital}). Kripya samay par pahunchein.",
            "kn": f"ನಮಸ್ಕಾರ {patient_name}! ನೆನಪೋಲೆ: {doc_name} ಅವರೊಂದಿಗೆ ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ {slot} ಗಂಟೆಗೆ ನಿಗದಿಯಾಗಿದೆ ({hospital}).",
            "te": f"నమస్కారం {patient_name}! రిమైండర్: {doc_name} గారితో మీ అపాయింట్‌మెంట్ {slot} సమయానికి ఖరారైంది ({hospital}).",
            "en": f"Reminder for {patient_name}: Your consultation with {doc_name} is scheduled for {slot} at {hospital}. Please arrive 10 mins prior."
        }
        msg = reminder_texts.get(lang, reminder_texts["en"])
        emit_event(
            event_type="REMINDER_TRIGGERED",
            title="Automated Pre-Visit Voice & SMS Reminder",
            details={
                "recipient": phone,
                "channel": "Outbound Voice & SMS",
                "message": msg,
                "status": "DISPATCHED",
                "trigger_time": "T+12s (Fast Demo Simulation)"
            }
        )

    timer_reminder = threading.Timer(12.0, trigger_reminder)
    timer_reminder.daemon = True
    timer_reminder.start()

    # 3. Simulated Follow-up & Feedback (fires at T+25s)
    def trigger_followup():
        feedback_prompts = {
            "hi": f"Namaste {patient_name}, {doc_name} ke sath aapka anubhav kaisa raha? 1 se 5 ke beech feedback dein ya voice note bhejein.",
            "kn": f"ನಮಸ್ಕಾರ {patient_name}, {doc_name} ಅವರ ಚಿಕಿತ್ಸೆ ಹೇಗೆ ಅನಿಸಿತು? ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ಹಂಚಿಕೊಳ್ಳಿ.",
            "te": f"నమస్కారం {patient_name}, {doc_name} గారి సంప్రదింపు ఎలా అనిపించింది? దయచేసి మీ ఫీడ్‌బ్యాక్ తెలియజేయండి.",
            "en": f"Hi {patient_name}, how was your consultation with {doc_name}? Please reply 1-5 to share your feedback or prescribe request."
        }
        fmsg = feedback_prompts.get(lang, feedback_prompts["en"])
        emit_event(
            event_type="FOLLOWUP_FEEDBACK_REQUESTED",
            title="Post-Consultation Follow-up & Feedback",
            details={
                "recipient": phone,
                "channel": "Interactive SMS / IVR",
                "message": fmsg,
                "status": "AWAITING_REPLY",
                "trigger_time": "T+25s (Fast Demo Simulation)"
            }
        )

    timer_followup = threading.Timer(25.0, trigger_followup)
    timer_followup.daemon = True
    timer_followup.start()
