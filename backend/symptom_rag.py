import re
from typing import Dict, Any, Tuple, Optional

# Red flags requiring immediate emergency intervention (108 Ambulance)
EMERGENCY_KEYWORDS = [
    # English
    "chest pain", "heart attack", "can't breathe", "cannot breathe", "severe bleeding", "unconscious", "stroke", "ambulance",
    # Hindi / Hinglish
    "chhati me dard", "chhati mein dard", "seene me dard", "saans nahi aa rahi", "behosh", "khoon beh raha", "dil ka daura", "ambulance chahiye",
    # Kannada
    "ede novu", "usirata kasta", "ede yalli novu", "raktasrava", "ede novu agide", "ambulance beku",
    # Telugu
    "gunde noppi", "oopiri aadatledu", "gundelo noppi", "raktha sravam", "spruha ledu", "ambulance kavali"
]

# Symptom to Medical Speciality Knowledge Map
SYMPTOM_MAP = {
    "Neurologist": {
        "keywords": [
            "sar dard", "sir dard", "headache", "migraine", "chakkar", "giddiness", "fainting",
            "talenovu", "tale novu", "tale tiruguvike", "thalanoppi", "thala thirugadam", "nerve pain", "nerves"
        ],
        "name_en": "Neurologist",
        "symptom_name": {"en": "headache", "hi": "sar dard", "kn": "tale novu", "te": "thalanoppi"}
    },
    "General Physician": {
        "keywords": [
            "bukhar", "fever", "jvara", "jwara", "jwaram", "khansi", "cough", "kemmu", "daggudu",
            "weakness", "kamzori", "thakan", "badan dard", "body ache", "deha novu", "angala noppi",
            "cold", "sardi", "sheetha", "jalubu", "chills"
        ],
        "name_en": "General Physician",
        "symptom_name": {"en": "fever or cold", "hi": "bukhar ya sardi", "kn": "jwara athava kemmu", "te": "jwaram leda daggu"}
    },
    "Pediatrician": {
        "keywords": [
            "baccha", "baby", "child", "infant", "kid", "chota baccha",
            "magu", "puttina magu", "paapa", "pillalu", "chinna pillalu"
        ],
        "name_en": "Pediatrician",
        "symptom_name": {"en": "child health", "hi": "baccho ki takleef", "kn": "makkala arogya", "te": "chinna pillala samasya"}
    },
    "Orthopedic Surgeon": {
        "keywords": [
            "haddi", "bone", "joint pain", "knee pain", "ghutne me dard", "fracture",
            "muri", "moch", "kaalu novu", "mokaalu novu", "kaalla noppi", "keelu noppi", "back pain", "kamar dard"
        ],
        "name_en": "Orthopedic Surgeon",
        "symptom_name": {"en": "joint or bone pain", "hi": "ghutno ya haddi ka dard", "kn": "keelu athava moole novu", "te": "keella noppi"}
    },
    "Gastroenterologist": {
        "keywords": [
            "pet dard", "stomach pain", "acidity", "gas", "kabz", "vomiting", "ulti",
            "hotte novu", "kadupu noppi", "vanti", "loose motion", "diarrhea", "dast"
        ],
        "name_en": "Gastroenterologist",
        "symptom_name": {"en": "stomach ache or digestive issues", "hi": "pet dard ya acidity", "kn": "hotte novu athava acidity", "te": "kadupu noppi"}
    },
    "ENT Specialist": {
        "keywords": [
            "kaan dard", "ear pain", "throat pain", "gala kharab", "kivinuvu", "gontu noppi", "sore throat"
        ],
        "name_en": "ENT Specialist",
        "symptom_name": {"en": "ear or throat discomfort", "hi": "kaan ya gale me dard", "kn": "kivi athava gontu novu", "te": "chevi leda gonthu noppi"}
    }
}

# Duration keywords (indicates patient already specified duration)
DURATION_KEYWORDS = [
    "kal se", "aaj se", "din se", "dino se", "hafte se", "mahine se",
    "since yesterday", "for 2 days", "two days", "3 days", "few days", "since", "days", "hours", "week",
    "eradu dinadinda", "dina", "ninne", "eradu dina",
    "repatnundi", "ninna", "rojula nundi", "rendu rojula"
]

def analyze_symptoms_and_triage(text: str, current_lang: str = "hi") -> Tuple[bool, Optional[str], Optional[str], str, bool, Optional[str]]:
    """
    Returns:
    (is_emergency: bool, detected_speciality: Optional[str], guidance_msg: Optional[str], 
     code_mixed_type: str, has_duration: bool, matched_symptom: Optional[str])
    """
    text_lower = text.lower().strip()
    
    # Check for emergency red flags
    for red_flag in EMERGENCY_KEYWORDS:
        if red_flag in text_lower:
            emergency_msg = {
                "hi": "SAVDHAN: Yeh emergency lakshan lag rahe hain. Kripya turant 108 ambulance call karein ya nikat-tam hospital emergency jayein. Kya main 108 ambulance alert kar doon?",
                "kn": "ಎಚ್ಚರಿಕೆ: ಇದು ತುರ್ತು ಪರಿಸ್ಥಿತಿಯ ಲಕ್ಷಣವಾಗಿದೆ. ದಯವಿಟ್ಟು ತಕ್ಷಣ 108 ಆಂಬ್ಯುಲೆನ್ಸ್ ಕರೆ ಮಾಡಿ ಅಥವಾ ಸಮೀಪದ ತುರ್ತು ಚಿಕಿತ್ಸಾ ವಿಭಾಗಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.",
                "te": "హెచ్చరిక: ఇది అత్యవసర పరిస్థితి కావచ్చు. దయచేసి వెంటనే 108 అంబులెన్స్‌కు కాల్ చేయండి లేదా దగ్గరలోని ఎమర్జెన్సీ వార్డుకు వెళ్ళండి.",
                "en": "EMERGENCY ALERT: These symptoms require immediate medical attention. Please call 108 ambulance immediately or visit the nearest emergency casualty. Shall I alert emergency services?"
            }.get(current_lang, "EMERGENCY ALERT: Please call 108 immediately.")
            return True, "Emergency Medicine", emergency_msg, "Emergency", True, red_flag

    # Match symptoms to speciality
    detected_speciality = None
    guidance = None
    matched_symptom = None
    
    for spec, data in SYMPTOM_MAP.items():
        for kw in data["keywords"]:
            # Match whole words or phrase
            pattern = r'\b' + re.escape(kw) + r'\b'
            if re.search(pattern, text_lower):
                detected_speciality = spec
                matched_symptom = data["symptom_name"].get(current_lang, data["symptom_name"]["en"])
                break
        if detected_speciality:
            break

    # Check if duration is mentioned
    has_duration = any(kw in text_lower for kw in DURATION_KEYWORDS) or bool(re.search(r'\b\d+\s*(day|days|din|dina|hours|week)\b', text_lower))

    # Detect code-mixing flavor
    detected_mix = "Standard"
    if any(w in text_lower for w in ["hai", "mujhe", "chahiye", "karo", "dikhao", "kal"]):
        detected_mix = "Hinglish / Hindi"
    elif any(w in text_lower for w in ["ide", "beku", "nanage", "maadi", "yaaru"]):
        detected_mix = "Kannada-English Code-mix"
    elif any(w in text_lower for w in ["undi", "kavali", "naaku", "cheyandi", "evaru"]):
        detected_mix = "Telugu-English Code-mix"

    return False, detected_speciality, guidance, detected_mix, has_duration, matched_symptom
