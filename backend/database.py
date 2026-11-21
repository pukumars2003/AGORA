import math
import threading
import uuid
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta

# ─── Concurrency Control ───
_booking_lock = threading.Lock()
BOOKED_SLOTS: Dict[tuple, str] = {}  # (doctor_id, date, slot) -> patient_name
DOCTOR_CAPACITY: Dict[str, int] = {}  # doctor_id -> max per day (default 15)
DEFAULT_MAX_PATIENTS_PER_DAY = 15

# ─── Hand-crafted showcase doctors (6) ───
DOCTORS: List[Dict] = [
    {
        "id": "doc-001",
        "name": "Dr. Ramesh Kumar",
        "degrees": "MBBS, MD (Internal Medicine), NIMHANS Fellow",
        "speciality": "General Physician & Neurologist",
        "hospital": "Manipal Clinic, Koramangala",
        "landmark": "Near Sony World Junction, 4th Block",
        "city": "Bengaluru",
        "distance": "1.2 km away",
        "distance_km": 1.2,
        "travel_time": "5 mins",
        "coordinates": {"lat": 12.9352, "lng": 77.6245},
        "map_directions": [
            "Head south on 80 Feet Road toward 4th Block (400 m)",
            "Turn left at Sony World Signal onto 100 Feet Road (500 m)",
            "Manipal Clinic will be on your left, next to Apollo Pharmacy (300 m)"
        ],
        "rating": 4.9,
        "review_count": 842,
        "experience": "14+ years",
        "patients_treated": "18,000+",
        "fee": "₹400",
        "languages": ["kn", "hi", "en"],
        "expertise_tags": ["Migraine & Chronic Headaches", "Viral & Typhoid Fever", "Hypertension & BP Management", "Cervical Spondylosis", "Diabetes Mellitus"],
        "diseases_treated": ["headache", "migraine", "sar dard", "talenovu", "fever", "bukhar", "jvara", "typhoid", "dengue", "bp", "blood pressure", "chakkar", "giddiness", "viral fever"],
        "why_best": [
            "Listens patiently and explains the root cause in simple language without jargon",
            "Prescribes minimal, affordable generic medicines with zero unnecessary scans",
            "Multi-lingual: Speaks fluent Kannada, Hindi and English comfortably",
            "Consistently rated 5 stars for short wait times (<8 minutes)"
        ],
        "top_reviews": [
            {"patient": "Venkatesh Gowda", "city": "Bengaluru", "rating": 5, "text": "My 3-year migraine problem was resolved in just 2 consultations. He didn't order costly MRI scans like other clinics. Very compassionate doctor!", "date": "2 days ago"},
            {"patient": "Pooja Hegde", "city": "Bengaluru", "rating": 5, "text": "Dr. Ramesh explains everything in Kannada and Hindi so clearly. Fee is very reasonable for Koramangala. Best doctor in South Bangalore.", "date": "1 week ago"}
        ],
        "trust_badges": ["NIMHANS Alumnus", "KMC Verified #48921", "Top Rated Bangalore 2026", "Generic Medicine Pioneer"],
        "available_dates": ["2026-11-21", "2026-11-22", "2026-11-23"],
        "slots": ["10:00 AM", "11:30 AM", "02:00 PM", "05:00 PM", "06:30 PM"],
        "avatar": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=250"
    },
    {
        "id": "doc-002",
        "name": "Dr. Lakshmi Prasanna",
        "degrees": "MBBS, DM (Neurology) - AIIMS New Delhi, FRCP (London)",
        "speciality": "Senior Neurologist & Stroke Specialist",
        "hospital": "Apollo Hospitals, Jubilee Hills",
        "landmark": "Opposite KBR Park, Road No. 36",
        "city": "Hyderabad",
        "distance": "2.4 km away",
        "distance_km": 2.4,
        "travel_time": "8 mins",
        "coordinates": {"lat": 17.4319, "lng": 78.4073},
        "map_directions": ["Head west on Road No. 36 toward KBR Park (800 m)", "Take the U-turn at Peddamma Temple Junction (400 m)", "Apollo Hospitals main OPD tower will be on your right (1.2 km)"],
        "rating": 4.95,
        "review_count": 1240,
        "experience": "18+ years",
        "patients_treated": "24,000+",
        "fee": "₹600",
        "languages": ["te", "hi", "en"],
        "expertise_tags": ["Severe Migraine & Cluster Headaches", "Epilepsy & Seizure Disorders", "Stroke Rehabilitation", "Nerve & Peripheral Neuropathy", "Sleep Disorders"],
        "diseases_treated": ["headache", "migraine", "thalanoppi", "thala thirugadam", "fits", "seizure", "paralysis", "stroke", "nerve pain", "nerves", "tremors", "dizziness"],
        "why_best": ["Gold medalist from AIIMS New Delhi with global neurological training", "Specialized diagnostic lab for acute headache and stroke prevention", "Deeply empathetic approach, converses natively in Telugu and Hindi", "Ranked #1 Neurologist in Telangana by Times Health Excellence"],
        "top_reviews": [
            {"patient": "K. Srinivas Rao", "city": "Hyderabad", "rating": 5, "text": "Dr. Lakshmi garu is like god for our family. She accurately diagnosed my mother's trigeminal nerve pain when 3 hospitals failed.", "date": "3 days ago"},
            {"patient": "Anusha Reddy", "city": "Hyderabad", "rating": 5, "text": "Very polite and attentive doctor. Her migraine treatment protocol gave me relief after 6 months of daily pain.", "date": "2 weeks ago"}
        ],
        "trust_badges": ["AIIMS Gold Medalist", "TSMC Verified #31894", "Apollo Stroke Lead", "Excellence Award 2026"],
        "available_dates": ["2026-11-21", "2026-11-22", "2026-11-23"],
        "slots": ["10:30 AM", "12:00 PM", "03:30 PM", "05:30 PM"],
        "avatar": "https://images.unsplash.com/photo-1594824813576-9c471c691376?w=250"
    },
    {
        "id": "doc-003",
        "name": "Dr. Rajesh Sharma",
        "degrees": "MBBS, MD (Medicine), DM (Neurology) - GB Pant",
        "speciality": "Neurologist & Headache Specialist",
        "hospital": "Fortis Escorts, Okhla",
        "landmark": "Near Sukhdev Vihar Metro Station",
        "city": "Delhi",
        "distance": "3.1 km away",
        "distance_km": 3.1,
        "travel_time": "12 mins",
        "coordinates": {"lat": 28.5603, "lng": 77.2797},
        "map_directions": ["Head toward Mathura Road from Sukhdev Vihar Metro (1 km)", "Take the service lane opposite Escorts Heart Institute (1.2 km)", "Fortis OPD Gate 2 on the right side (900 m)"],
        "rating": 4.88,
        "review_count": 915,
        "experience": "16+ years",
        "patients_treated": "19,000+",
        "fee": "₹500",
        "languages": ["hi", "en"],
        "expertise_tags": ["Tension Headache & Migraine", "Vertigo & Balance Disorders", "Diabetic Neuropathy", "Spine & Sciatica Pain", "Brain Fog & Memory Issues"],
        "diseases_treated": ["headache", "migraine", "sar dard", "sir dard", "chakkar", "vertigo", "back pain", "sciatica", "paralysis", "nerve pain", "cervical"],
        "why_best": ["Expert in non-invasive migraine trigger management and lifestyle coaching", "Famous for calm and thorough consultations in Hindi", "Direct digital prescription with fast WhatsApp follow-up support"],
        "top_reviews": [{"patient": "Harish Khurana", "city": "Delhi", "rating": 5, "text": "Excellent doctor. Explained how my neck posture was causing morning headaches. No costly medicine, just exercises and mild relief drops.", "date": "4 days ago"}],
        "trust_badges": ["DMC Certified #51203", "GB Pant Alumnus", "Fortis Senior Consultant"],
        "available_dates": ["2026-11-21", "2026-11-22", "2026-11-23"],
        "slots": ["09:30 AM", "11:00 AM", "04:00 PM", "06:00 PM"],
        "avatar": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=250"
    },
    {
        "id": "doc-004",
        "name": "Dr. Priya Venkatesh",
        "degrees": "MBBS, DCH, MD (Pediatrics) - St. John's Medical College",
        "speciality": "Senior Pediatrician & Child Specialist",
        "hospital": "Rainbow Children's Hospital, Marathahalli",
        "landmark": "Near Innovative Multiplex, Outer Ring Road",
        "city": "Bengaluru",
        "distance": "2.1 km away",
        "distance_km": 2.1,
        "travel_time": "7 mins",
        "coordinates": {"lat": 12.9562, "lng": 77.7019},
        "map_directions": ["Take Outer Ring Road service road towards Marathahalli bridge (1.2 km)", "Turn left next to Kalamandir (400 m)", "Rainbow Children's Hospital entrance on left (500 m)"],
        "rating": 4.92,
        "review_count": 1105,
        "experience": "12+ years",
        "patients_treated": "16,000+ children",
        "fee": "₹450",
        "languages": ["kn", "te", "hi", "en"],
        "expertise_tags": ["Childhood Asthma & Wheezing", "Infant Nutrition & Colic Relief", "Vaccination & Growth Tracking", "Pediatric Allergy & Rash", "Neonatal Intensive Care"],
        "diseases_treated": ["child fever", "baby fever", "bachha", "magu", "pillalu", "cough", "wheezing", "asthma", "vaccination", "vomiting", "loose motion", "ear pain"],
        "why_best": ["Incredible patience with crying babies and anxious first-time parents", "Never over-prescribes antibiotics; prioritizes natural immune recovery", "Fluently speaks 4 languages: Kannada, Telugu, Hindi and English"],
        "top_reviews": [{"patient": "Deepa Nambiar (Mother)", "city": "Bengaluru", "rating": 5, "text": "Dr. Priya is wonderful. My 1-year-old was having recurring wheezing, and she calmly guided us on inhaler technique. Baby is smiling now!", "date": "Yesterday"}],
        "trust_badges": ["St. John's Gold Medal", "Indian Academy of Pediatrics Fellow", "Child Friendly Clinic 2026"],
        "available_dates": ["2026-11-21", "2026-11-22", "2026-11-23"],
        "slots": ["10:00 AM", "11:30 AM", "03:00 PM", "05:00 PM"],
        "avatar": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=250"
    },
    {
        "id": "doc-005",
        "name": "Dr. Suresh Patel",
        "degrees": "MBBS, MS (Orthopedics) - KEM Mumbai, Joint Fellowship (Germany)",
        "speciality": "Orthopedic & Robotic Joint Surgeon",
        "hospital": "Nanavati Super Speciality, Vile Parle",
        "landmark": "SV Road, Near Vile Parle Station",
        "city": "Mumbai",
        "distance": "1.8 km away",
        "distance_km": 1.8,
        "travel_time": "6 mins",
        "coordinates": {"lat": 19.0968, "lng": 72.8433},
        "map_directions": ["Head north on SV Road toward Milan Subway (800 m)", "Cross Vile Parle East flyover (600 m)", "Nanavati Hospital main entrance on your right (400 m)"],
        "rating": 4.86,
        "review_count": 870,
        "experience": "20+ years",
        "patients_treated": "22,000+",
        "fee": "₹650",
        "languages": ["hi", "en"],
        "expertise_tags": ["Knee Osteoarthritis & Cartilage Repair", "Robotic Total Knee Replacement", "Frozen Shoulder & Rotator Cuff", "Sports Ligament (ACL/MCL) Tear", "Slip Disc & Sciatica"],
        "diseases_treated": ["knee pain", "ghutna dard", "kaalu novu", "keelu noppi", "joint pain", "arthritis", "bone fracture", "back pain", "shoulder pain", "sprain"],
        "why_best": ["Over 4,500 successful robotic joint replacements with same-day walking recovery", "Recommends physiotherapy and lifestyle changes before surgery is ever discussed", "Transparent pricing and warm bedside manner"],
        "top_reviews": [{"patient": "Mahesh Shah", "city": "Mumbai", "rating": 5, "text": "My 68-year-old mother got her knee replacement done by Dr. Suresh. She was walking pain-free on day 2. Top-class surgeon!", "date": "5 days ago"}],
        "trust_badges": ["KEM Hospital Alumnus", "German Joint Fellow", "MMC Certified #39281"],
        "available_dates": ["2026-11-21", "2026-11-22", "2026-11-23"],
        "slots": ["11:00 AM", "02:30 PM", "04:30 PM"],
        "avatar": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=250"
    },
    {
        "id": "doc-006",
        "name": "Dr. Ananya Gowda",
        "degrees": "MBBS, MD (General Medicine) - Bangalore Medical College (BMC)",
        "speciality": "Consultant Physician & Family Medicine",
        "hospital": "Janata Seva Polyclinic, Rajajinagar",
        "landmark": "10th Main, Near Rajajinagar Metro",
        "city": "Bengaluru",
        "distance": "1.5 km away",
        "distance_km": 1.5,
        "travel_time": "5 mins",
        "coordinates": {"lat": 12.9915, "lng": 77.5554},
        "map_directions": ["Exit Rajajinagar Metro toward 10th Main (300 m)", "Turn right near ESI Hospital Road (700 m)", "Janata Seva Polyclinic on right side (500 m)"],
        "rating": 4.89,
        "review_count": 680,
        "experience": "9+ years",
        "patients_treated": "12,000+",
        "fee": "₹250",
        "languages": ["kn", "hi", "en"],
        "expertise_tags": ["Dengue & Viral Fevers", "Diabetes & Thyroid Management", "Gastroenteritis & Food Poisoning", "Geriatric (Elderly) Care", "Preventive Health Checkups"],
        "diseases_treated": ["fever", "jvara", "bukhar", "cough", "kemmu", "cold", "infection", "vomiting", "stomach pain", "loose motion", "weakness", "sugar", "diabetes"],
        "why_best": ["Highly affordable fee (₹250) catering to urban working class and rural families", "Fluent native Kannada communication with respectful and friendly care", "Zero unnecessary testing policy with high diagnostic accuracy"],
        "top_reviews": [{"patient": "Basavaraju M.", "city": "Bengaluru", "rating": 5, "text": "Tumha olle doctor. Kannada dalli thumba channagi artha madisthare. Fee kooda thumba kammi ide.", "date": "3 days ago"}],
        "trust_badges": ["BMCRI Alumnus", "KMC Verified #61984", "Affordable Care Champion"],
        "available_dates": ["2026-11-21", "2026-11-22", "2026-11-23"],
        "slots": ["09:00 AM", "10:30 AM", "01:30 PM", "06:00 PM"],
        "avatar": "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=250"
    }
]

# ─── Load 1,000+ generated doctors ───
try:
    from doctors_generator import generate_all_doctors
    DOCTORS.extend(generate_all_doctors())
except Exception as e:
    print(f"[WARN] Doctor generator skipped: {e}")

# ─── Persistent stores ───
APPOINTMENTS: List[Dict] = []

PRESCRIPTIONS: List[Dict] = [
    {
        "id": "RX-89412",
        "doctor_id": "doc-001",
        "doctor_name": "Dr. Ramesh Kumar",
        "patient_name": "Ravi Kumar",
        "date": "2026-11-21",
        "diagnosis": "Acute Tension Migraine & Mild Fever",
        "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500",
        "medicines": [
            {
                "name": "Paracetamol 650mg (Dolo)",
                "type": "Tablet",
                "dosage": "1 tablet",
                "frequency": "Twice a day (Morning & Night)",
                "timing": "After meals",
                "duration": "3 days",
                "reminder_times": ["08:30 AM", "09:00 PM"],
                "voice_instruction": {
                    "hi": "Paracetamol 650mg khane ke baad subah 8:30 aur raat 9 baje 1 goli lein.",
                    "kn": "ಪ್ಯಾರಸಿಟಮಾಲ್ 650mg ಊಟದ ನಂತರ ಬೆಳಗ್ಗೆ 8:30 ಮತ್ತು ರಾತ್ರಿ 9 ಗಂಟೆಗೆ 1 ಮಾತ್ರೆ ತೆಗೆದುಕೊಳ್ಳಿ.",
                    "te": "పారాసిటమాల్ 650mg భోజనం తర్వాత ఉదయం 8:30 మరియు రాత్రి 9 గంటలకు 1 మాత్ర తీసుకోండి.",
                    "en": "Take 1 tablet of Paracetamol 650mg after meals at 8:30 AM and 9:00 PM."
                }
            },
            {
                "name": "Naproxen 250mg",
                "type": "Tablet",
                "dosage": "1 tablet",
                "frequency": "Once daily when headache starts",
                "timing": "With food",
                "duration": "5 days",
                "reminder_times": ["01:30 PM"],
                "voice_instruction": {
                    "hi": "Naproxen 250mg sar dard shuru hone par khane ke sath lein.",
                    "kn": "ನ್ಯಾಪ್ರಾಕ್ಸೆನ್ 250mg ತಲೆನೋವು ಬಂದಾಗ ಊಟದೊಂದಿಗೆ ತೆಗೆದುಕೊಳ್ಳಿ.",
                    "te": "న్యాప్రాక్సెన్ 250mg తలనొప్పి ఉన్నప్పుడు భోజనంతో తీసుకోండి.",
                    "en": "Take 1 tablet of Naproxen 250mg with food if headache persists."
                }
            },
            {
                "name": "Pantoprazole 40mg (Pan-40)",
                "type": "Capsule",
                "dosage": "1 capsule",
                "frequency": "Once daily (Morning)",
                "timing": "Before breakfast (Empty stomach)",
                "duration": "5 days",
                "reminder_times": ["07:30 AM"],
                "voice_instruction": {
                    "hi": "Pantoprazole 40mg subah nashte se aadha ghanta pehle khali pet lein.",
                    "kn": "ಪ್ಯಾಂಟೊಪ್ರಜೋಲ್ 40mg ಬೆಳಗ್ಗೆ ಉಪಹಾರಕ್ಕೂ ಮುನ್ನ ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ ತೆಗೆದುಕೊಳ್ಳಿ.",
                    "te": "పాంటోప్రజోల్ 40mg ఉదయం టిఫిన్‌కు ముందు ఖాళీ కడుపుతో తీసుకోండి.",
                    "en": "Take 1 capsule of Pantoprazole 40mg before breakfast on an empty stomach."
                }
            }
        ],
        "created_at": datetime.now().isoformat()
    }
]


# ─── Haversine Distance ───
def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return round(R * 2 * math.asin(math.sqrt(a)), 1)


# ─── Search Doctors ───
def search_doctors(
    speciality: Optional[str] = None,
    city: Optional[str] = None,
    language: Optional[str] = None,
    disease_query: Optional[str] = None,
    patient_lat: Optional[float] = None,
    patient_lng: Optional[float] = None,
) -> List[Dict]:
    results = DOCTORS.copy()

    if disease_query:
        dq_lower = disease_query.lower()
        matched = []
        for d in results:
            if any(dis in dq_lower or dq_lower in dis for dis in d.get("diseases_treated", [])):
                matched.append(d)
            elif any(tag.lower() in dq_lower or any(w in tag.lower() for w in dq_lower.split()) for tag in d.get("expertise_tags", [])):
                matched.append(d)
        if matched:
            results = matched

    if speciality:
        spec_lower = speciality.lower()
        spec_matches = [d for d in results if spec_lower in d["speciality"].lower() or any(w in d["speciality"].lower() for w in spec_lower.split())]
        if spec_matches:
            results = spec_matches

    if city:
        city_lower = city.lower()
        city_matches = [d for d in results if city_lower in d["city"].lower() or d["city"].lower() in city_lower]
        if city_matches:
            results = city_matches

    if language:
        lang_lower = language.lower()[:2]
        lang_matches = [d for d in results if lang_lower in d["languages"]]
        if lang_matches:
            results = lang_matches

    # Compute real distance if patient coordinates given
    if patient_lat is not None and patient_lng is not None:
        for d in results:
            coords = d.get("coordinates", {})
            if coords.get("lat") and coords.get("lng"):
                real_dist = haversine_km(patient_lat, patient_lng, coords["lat"], coords["lng"])
                d["distance_km"] = real_dist
                d["distance"] = f"{real_dist} km away"
                d["travel_time"] = f"{max(2, int(real_dist * 2.5))} mins"

    results.sort(key=lambda d: (d.get("distance_km", 5.0), -d.get("rating", 4.5)))
    return results[:5]


def get_doctor_by_id(doctor_id: str) -> Optional[Dict]:
    for d in DOCTORS:
        if d["id"] == doctor_id:
            return d
    return None


def get_slots(doctor_id: str, date: Optional[str] = None) -> List[str]:
    doc = get_doctor_by_id(doctor_id)
    if not doc:
        return ["10:00 AM", "11:30 AM", "05:00 PM"]
    date_key = date or (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    # Filter out already-booked slots
    all_slots = doc.get("slots", ["10:00 AM", "11:30 AM", "05:00 PM"])
    available = [s for s in all_slots if (doctor_id, date_key, s) not in BOOKED_SLOTS]
    return available if available else all_slots


def book_appointment_record(
    doctor_id: str,
    slot: str,
    patient_name: str,
    phone: str,
    reason: str = "Consultation",
    language: str = "hi"
) -> Dict:
    with _booking_lock:
        doc = get_doctor_by_id(doctor_id) or DOCTORS[0]
        date_str = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        concurrency_note = None
        final_slot = slot if slot else "11:00 AM"

        # Check daily capacity
        day_bookings = sum(1 for key in BOOKED_SLOTS if key[0] == doc["id"] and key[1] == date_str)
        max_cap = DOCTOR_CAPACITY.get(doc["id"], DEFAULT_MAX_PATIENTS_PER_DAY)

        if day_bookings >= max_cap:
            # Doctor full — find alternative in same city & speciality
            alt_docs = [d for d in DOCTORS if d["city"] == doc["city"] and d["id"] != doc["id"]
                        and any(w in d["speciality"].lower() for w in doc["speciality"].lower().split())]
            alt_docs.sort(key=lambda x: x.get("distance_km", 99))
            if alt_docs:
                doc = alt_docs[0]
                concurrency_note = f"Original doctor fully booked ({max_cap} patients). Automatically switched to {doc['name']} ({doc.get('distance', 'nearby')})."

        # Check specific slot availability
        slot_key = (doc["id"], date_str, final_slot)
        if slot_key in BOOKED_SLOTS:
            # Slot taken — find next available
            all_slots = doc.get("slots", ["10:00 AM", "11:30 AM", "02:00 PM", "05:00 PM"])
            available = [s for s in all_slots if (doc["id"], date_str, s) not in BOOKED_SLOTS]
            if available:
                old_slot = final_slot
                final_slot = available[0]
                concurrency_note = f"Slot {old_slot} was just booked. Automatically assigned next available: {final_slot}."
            else:
                concurrency_note = f"All slots with {doc['name']} are booked for {date_str}. Please try another date."

        # Record the booking
        BOOKED_SLOTS[(doc["id"], date_str, final_slot)] = patient_name

        appointment_id = f"APT-{uuid.uuid4().hex[:6].upper()}"
        record = {
            "id": appointment_id,
            "doctor_id": doc["id"],
            "doctor_name": doc["name"],
            "degrees": doc.get("degrees", "MBBS, MD"),
            "speciality": doc["speciality"],
            "hospital": doc["hospital"],
            "landmark": doc.get("landmark", "City Center"),
            "city": doc["city"],
            "distance": doc.get("distance", "1.2 km away"),
            "distance_km": doc.get("distance_km", 1.2),
            "map_directions": doc.get("map_directions", []),
            "date": date_str,
            "slot": final_slot,
            "fee": doc["fee"],
            "patient_name": patient_name or "Bharat Citizen",
            "phone": phone or "+91 98765 43210",
            "reason": reason,
            "language": language,
            "status": "CONFIRMED",
            "rating": doc["rating"],
            "avatar": doc["avatar"],
            "why_best": doc.get("why_best", [])[:2],
            "created_at": datetime.now().isoformat()
        }
        if concurrency_note:
            record["concurrency_note"] = concurrency_note

        APPOINTMENTS.insert(0, record)
        return record


def scan_prescription_data(image_url: Optional[str] = None, text_content: Optional[str] = None) -> Dict[str, Any]:
    from prescription_parser import scan_prescription_data as parse_rx
    return parse_rx(image_url=image_url, text_content=text_content)
