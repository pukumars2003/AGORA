import re
from typing import Dict, Any, Tuple

# Red flags requiring immediate emergency intervention (108 Ambulance)
EMERGENCY_KEYWORDS = [
    # English
    "chest pain", "heart attack", "can't breathe", "cannot breathe", "severe bleeding", "unconscious", "stroke",
    # Hindi / Hinglish
    "chhati me dard", "chhati mein dard", "seene me dard", "saans nahi aa rahi", "behosh", "khoon beh raha", "dil ka daura",
    # Kannada
    "ede novu", "usirata kasta", "ede yalli novu", "raktasrava", "ede novu agide",
    # Telugu
    "gunde noppi", "oopiri aadatledu", "gundelo noppi", "raktha sravam", "spruha ledu"
]

# Symptom to Medical Speciality Knowledge Map
SYMPTOM_MAP = {
    "Neurologist": {
        "keywords": [
            "sar dard", "sir dard", "headache", "migraine", "chakkar", "giddiness", "fainting",
            "talenovu", "tale tiruguvike", "thalanoppi", "thala thirugadam", "nerve pain", "nerves"
        ],
        "advice": {
            "hi": "Sar dard aur migraine ke liye ek Neurologist ya Physician ko dikhana behtar rahega.",
            "kn": "ತಲೆನೋವಿಗೆ ನ್ಯೂರಾಲಜಿಸ್ಟ್ ಅಥವಾ ಜನರಲ್ ಫಿಸಿಶಿಯನ್ ಅವರನ್ನು ಭೇಟಿ ಮಾಡುವುದು ಉತ್ತಮ.",
            "te": "తలనొప్పికి న్యూరాలజిస్ట్ లేదా జనరల్ ఫిజీషియన్‌ను సంప్రదించడం మంచిది.",
            "en": "For persistent headache or migraine symptoms, a Neurologist or Physician consultation is recommended."
        }
    },
    "General Physician": {
        "keywords": [
            "bukhar", "fever", "jvara", "jwaram", "khansi", "cough", "kemmu", "daggudu",
            "weakness", "kamzori", "thakan", "badan dard", "body ache", "deha novu", "angala noppi",
            "cold", "sardi", "sheetha", "jalubu"
        ],
        "advice": {
            "hi": "Bukhar aur sardi ke liye General Physician sabse sahi vikalp hain.",
            "kn": "ಜ್ವರ ಮತ್ತು ಕೆಮ್ಮಿಗೆ ಜನರಲ್ ಫಿಸಿಶಿಯನ್ ಅವರನ್ನು ಸಂಪರ್ಕಿಸುವುದು ಸೂಕ್ತ.",
            "te": "జ్వరం మరియు దగ్గుకు జనరల్ ఫిజీషియన్‌ను సంప్రదించడం సరైనది.",
            "en": "A General Physician is ideal for evaluating fever, cold, or body ache symptoms."
        }
    },
    "Pediatrician": {
        "keywords": [
            "baccha", "baby", "child", "infant", "kid", "chota baccha",
            "magu", "puttina magu", "paapa", "pillalu", "chinna pillalu"
        ],
        "advice": {
            "hi": "Bachho ke swasthya ke liye hum Pediatrician (Bal Rog Visheshagya) se milne ki salah dete hain.",
            "kn": "ಮಕ್ಕಳ ಆರೋಗ್ಯ ತಪಾಸಣೆಗೆ ಪೀಡಿಯಾಟ್ರಿಶಿಯನ್ ಸೂಕ್ತ.",
            "te": "పిల్లల ఆరోగ్య సమస్యలకు పీడియాట్రీషియన్‌ను సంప్రదించాలి.",
            "en": "For infants and children, a certified Pediatrician consultation is advised."
        }
    },
    "Orthopedic Surgeon": {
        "keywords": [
            "haddi", "bone", "joint pain", "knee pain", "ghutne me dard", "fracture",
            "muri", "moch", "kaalu novu", "mokaalu novu", "kaalla noppi", "keelu noppi"
        ],
        "advice": {
            "hi": "Ghutno ya haddi ke dard ke liye Orthopedic specialist se milna chahiye.",
            "kn": "ಮೂಳೆ ಅಥವಾ ಕೀಲು ನೋವಿಗೆ ಆರ್ಥೋಪೆಡಿಕ್ ವೈದ್ಯರನ್ನು ಕಾಣಬಹುದು.",
            "te": "కీళ్ల నొప్పులు లేదా ఎముక సమస్యలకు ఆర్థోపెడిక్ నిపుణులను సంప్రదించాలి.",
            "en": "An Orthopedic specialist is best equipped for joint and bone conditions."
        }
    },
    "Gastroenterologist": {
        "keywords": [
            "pet dard", "stomach pain", "acidity", "gas", "kabz", "vomiting", "ulti",
            "hotte novu", "kadupu noppi", "vanti"
        ],
        "advice": {
            "hi": "Pet me dard ya acidity ke liye Gastroenterologist ko dikhana chahiye.",
            "kn": "ಹೊಟ್ಟೆ ನೋವಿಗೆ ಗ್ಯಾಸ್ಟ್ರೋಎಂಟರಾಲಜಿಸ್ಟ್ ಸೂಕ್ತ.",
            "te": "కడుపు నొప్పి లేదా గ్యాస్ సమస్యకు గ్యాస్ట్రోఎంటరాలజిస్ట్‌ను కలవాలి.",
            "en": "A Gastroenterologist consultation is recommended for digestive or abdominal issues."
        }
    }
}

def analyze_symptoms_and_triage(text: str, current_lang: str = "hi") -> Tuple[bool, str, str, str]:
    """
    Returns:
    (is_emergency: bool, detected_speciality: str, contextual_guidance: str, code_mixed_type: str)
    """
    text_lower = text.lower().strip()
    
    # Check for emergency red flags
    for red_flag in EMERGENCY_KEYWORDS:
        if red_flag in text_lower:
            emergency_msg = {
                "hi": "SAVDHAN: Yeh emergency lakshan lag rahe hain. Kripya turant 108 ambulance call karein ya nikat-tam hospital emergency jayein.",
                "kn": "ಎಚ್ಚರಿಕೆ: ಇದು ತುರ್ತು ಪರಿಸ್ಥಿತಿಯ ಲಕ್ಷಣವಾಗಿದೆ. ದಯವಿಟ್ಟು ತಕ್ಷಣ 108 ಆಂಬ್ಯುಲೆನ್ಸ್ ಕರೆ ಮಾಡಿ ಅಥವಾ ಸಮೀಪದ ತುರ್ತು ಚಿಕಿತ್ಸಾ ವಿಭಾಗಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.",
                "te": "హెచ్చరిక: ఇది అత్యవసర పరిస్థితి కావచ్చు. దయచేసి వెంటనే 108 అంబులెన్స్‌కు కాల్ చేయండి లేదా దగ్గరలోని ఎమర్జెన్సీ వార్డుకు వెళ్ళండి.",
                "en": "EMERGENCY ALERT: These symptoms require immediate medical attention. Please call 108 ambulance immediately or visit the nearest casualty."
            }.get(current_lang, "EMERGENCY ALERT: Please call 108 immediately.")
            return True, "Emergency Medicine", emergency_msg, "Emergency"

    # Match symptoms to speciality
    detected_speciality = "General Physician"
    guidance = ""
    
    for spec, data in SYMPTOM_MAP.items():
        if any(kw in text_lower for kw in data["keywords"]):
            detected_speciality = spec
            guidance = data["advice"].get(current_lang, data["advice"]["en"])
            break
            
    # Detect code-mixing flavor
    detected_mix = "Standard"
    if any(w in text_lower for w in ["hai", "mujhe", "chahiye", "karo", "dikhao", "kal"]):
        detected_mix = "Hinglish / Hindi"
    elif any(w in text_lower for w in ["ide", "beku", "nanage", "maadi", "yaaru"]):
        detected_mix = "Kannada-English Code-mix"
    elif any(w in text_lower for w in ["undi", "kavali", "naaku", "cheyandi", "evaru"]):
        detected_mix = "Telugu-English Code-mix"

    return False, detected_speciality, guidance, detected_mix
