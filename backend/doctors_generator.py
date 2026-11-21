"""
Generate 1,000+ realistic doctors across Bengaluru, Hyderabad, Delhi, Mumbai.
~250 per city, 15+ specialties, real neighborhoods & coordinates.
"""
import random
import math
from datetime import datetime, timedelta

CITIES = {
    "Bengaluru": {
        "neighborhoods": [
            {"area": "Koramangala", "lat": 12.9352, "lng": 77.6245, "landmark": "Near Forum Mall"},
            {"area": "Indiranagar", "lat": 12.9784, "lng": 77.6408, "landmark": "100 Feet Road"},
            {"area": "Whitefield", "lat": 12.9698, "lng": 77.7500, "landmark": "Near ITPL"},
            {"area": "Jayanagar", "lat": 12.9250, "lng": 77.5938, "landmark": "4th Block Complex"},
            {"area": "HSR Layout", "lat": 12.9116, "lng": 77.6389, "landmark": "Sector 1 Main Road"},
            {"area": "Marathahalli", "lat": 12.9562, "lng": 77.7019, "landmark": "Near Innovative Multiplex"},
            {"area": "Rajajinagar", "lat": 12.9915, "lng": 77.5554, "landmark": "Near Metro Station"},
            {"area": "BTM Layout", "lat": 12.9166, "lng": 77.6101, "landmark": "2nd Stage Main Road"},
            {"area": "Banashankari", "lat": 12.9255, "lng": 77.5468, "landmark": "Near BSK Bus Stand"},
            {"area": "Electronic City", "lat": 12.8456, "lng": 77.6603, "landmark": "Phase 1 Main Gate"},
            {"area": "Yelahanka", "lat": 13.1007, "lng": 77.5963, "landmark": "Near Air Force Station"},
            {"area": "Hebbal", "lat": 13.0358, "lng": 77.5970, "landmark": "Hebbal Flyover Junction"},
            {"area": "Malleshwaram", "lat": 13.0035, "lng": 77.5648, "landmark": "Sampige Road"},
            {"area": "JP Nagar", "lat": 12.9063, "lng": 77.5857, "landmark": "15th Cross Road"},
            {"area": "Basavanagudi", "lat": 12.9430, "lng": 77.5752, "landmark": "Near Bull Temple"},
        ],
        "hospitals": ["Manipal Hospital", "Apollo Clinic", "Narayana Health", "Columbia Asia", "Sakra World Hospital", "Fortis Hospital", "BGS Gleneagles", "Aster CMI", "MS Ramaiah Hospital", "St. John's Medical"],
        "languages": ["kn", "hi", "en"],
    },
    "Hyderabad": {
        "neighborhoods": [
            {"area": "Jubilee Hills", "lat": 17.4319, "lng": 78.4073, "landmark": "Near KBR Park"},
            {"area": "Banjara Hills", "lat": 17.4156, "lng": 78.4347, "landmark": "Road No. 12"},
            {"area": "Gachibowli", "lat": 17.4401, "lng": 78.3489, "landmark": "Near DLF Cyber City"},
            {"area": "Secunderabad", "lat": 17.4399, "lng": 78.4983, "landmark": "Near Clock Tower"},
            {"area": "Kukatpally", "lat": 17.4849, "lng": 78.3942, "landmark": "KPHB Colony"},
            {"area": "Madhapur", "lat": 17.4486, "lng": 78.3908, "landmark": "Hitech City Road"},
            {"area": "Ameerpet", "lat": 17.4375, "lng": 78.4483, "landmark": "Near Metro Station"},
            {"area": "Kondapur", "lat": 17.4600, "lng": 78.3548, "landmark": "Botanical Garden Road"},
            {"area": "LB Nagar", "lat": 17.3457, "lng": 78.5522, "landmark": "Near Chaitanyapuri"},
            {"area": "Miyapur", "lat": 17.4969, "lng": 78.3548, "landmark": "Miyapur X Roads"},
            {"area": "Begumpet", "lat": 17.4440, "lng": 78.4720, "landmark": "Near Greenlands"},
            {"area": "Dilsukhnagar", "lat": 17.3688, "lng": 78.5247, "landmark": "Near Moosarambagh"},
            {"area": "Himayatnagar", "lat": 17.3950, "lng": 78.4867, "landmark": "Near Nagarjuna Circle"},
            {"area": "Tarnaka", "lat": 17.4259, "lng": 78.5345, "landmark": "Near OU Campus"},
            {"area": "Mehdipatnam", "lat": 17.3950, "lng": 78.4393, "landmark": "Near Pillar No. 143"},
        ],
        "hospitals": ["Apollo Hospitals", "KIMS Hospital", "Yashoda Hospital", "Care Hospitals", "Continental Hospital", "AIG Hospitals", "Medicover Hospital", "Maxcure Hospital", "Sunshine Hospital", "Aware Gleneagles"],
        "languages": ["te", "hi", "en"],
    },
    "Delhi": {
        "neighborhoods": [
            {"area": "Okhla", "lat": 28.5603, "lng": 77.2797, "landmark": "Near Sukhdev Vihar Metro"},
            {"area": "Saket", "lat": 28.5245, "lng": 77.2066, "landmark": "Near Select City Walk"},
            {"area": "Dwarka", "lat": 28.5921, "lng": 77.0460, "landmark": "Sector 12 Main Road"},
            {"area": "Rohini", "lat": 28.7495, "lng": 77.0565, "landmark": "Sector 15 Metro"},
            {"area": "Lajpat Nagar", "lat": 28.5677, "lng": 77.2433, "landmark": "Central Market"},
            {"area": "Rajouri Garden", "lat": 28.6494, "lng": 77.1218, "landmark": "J Block Market"},
            {"area": "Pitampura", "lat": 28.7020, "lng": 77.1316, "landmark": "Near TV Tower"},
            {"area": "Vasant Kunj", "lat": 28.5195, "lng": 77.1570, "landmark": "Near Ambience Mall"},
            {"area": "Greater Kailash", "lat": 28.5494, "lng": 77.2340, "landmark": "GK-1 M Block Market"},
            {"area": "Janakpuri", "lat": 28.6219, "lng": 77.0813, "landmark": "C Block District Centre"},
            {"area": "Nehru Place", "lat": 28.5491, "lng": 77.2534, "landmark": "Near Lotus Temple"},
            {"area": "Karol Bagh", "lat": 28.6514, "lng": 77.1907, "landmark": "Ajmal Khan Road"},
            {"area": "Defence Colony", "lat": 28.5729, "lng": 77.2318, "landmark": "A Block Market"},
            {"area": "Preet Vihar", "lat": 28.6372, "lng": 77.2946, "landmark": "Vikas Marg"},
            {"area": "Mayur Vihar", "lat": 28.6093, "lng": 77.2975, "landmark": "Phase 1 Metro"},
        ],
        "hospitals": ["Fortis Escorts", "Max Super Speciality", "AIIMS Referral", "Sir Ganga Ram Hospital", "Apollo Hospital", "BLK-Max Hospital", "Medanta Clinic", "Primus Hospital", "Moolchand Hospital", "Venkateshwar Hospital"],
        "languages": ["hi", "en"],
    },
    "Mumbai": {
        "neighborhoods": [
            {"area": "Vile Parle", "lat": 19.0968, "lng": 72.8433, "landmark": "Near Station West"},
            {"area": "Andheri", "lat": 19.1136, "lng": 72.8697, "landmark": "Lokhandwala Complex"},
            {"area": "Bandra", "lat": 19.0596, "lng": 72.8295, "landmark": "Near Linking Road"},
            {"area": "Powai", "lat": 19.1176, "lng": 72.9060, "landmark": "Near Hiranandani"},
            {"area": "Dadar", "lat": 19.0178, "lng": 72.8478, "landmark": "Near Shivaji Park"},
            {"area": "Borivali", "lat": 19.2307, "lng": 72.8567, "landmark": "Near National Park"},
            {"area": "Thane", "lat": 19.2183, "lng": 72.9781, "landmark": "Ghodbunder Road"},
            {"area": "Malad", "lat": 19.1874, "lng": 72.8484, "landmark": "Link Road Junction"},
            {"area": "Goregaon", "lat": 19.1663, "lng": 72.8526, "landmark": "Near Film City"},
            {"area": "Kandivali", "lat": 19.2094, "lng": 72.8520, "landmark": "Near Mahavir Nagar"},
            {"area": "Chembur", "lat": 19.0522, "lng": 72.8970, "landmark": "Near Diamond Garden"},
            {"area": "Mulund", "lat": 19.1726, "lng": 72.9566, "landmark": "LBS Marg Junction"},
            {"area": "Ghatkopar", "lat": 19.0860, "lng": 72.9080, "landmark": "Near R City Mall"},
            {"area": "Worli", "lat": 19.0177, "lng": 72.8156, "landmark": "Near Sea Link"},
            {"area": "Navi Mumbai", "lat": 19.0330, "lng": 73.0297, "landmark": "Vashi Sector 17"},
        ],
        "hospitals": ["Nanavati Hospital", "Kokilaben Hospital", "Lilavati Hospital", "Hinduja Hospital", "Jaslok Hospital", "Breach Candy Hospital", "Bombay Hospital", "Fortis Hospital", "Apollo Spectra", "Hiranandani Hospital"],
        "languages": ["hi", "en"],
    },
}

SPECIALTIES = [
    {
        "name": "General Physician",
        "degrees": ["MBBS, MD (Medicine)", "MBBS, DNB (Medicine)", "MBBS, MD (Internal Medicine)"],
        "tags": ["Viral Fever & Flu", "Diabetes Management", "Hypertension & BP", "Thyroid Disorders", "Preventive Checkup"],
        "diseases": ["fever", "bukhar", "jvara", "cough", "cold", "weakness", "diabetes", "sugar", "bp", "thyroid", "infection", "body pain"],
    },
    {
        "name": "Neurologist",
        "degrees": ["MBBS, DM (Neurology)", "MBBS, MD, DM (Neurology)", "MBBS, DNB (Neurology)"],
        "tags": ["Migraine & Headaches", "Epilepsy & Seizures", "Stroke Rehabilitation", "Nerve Pain", "Memory Disorders"],
        "diseases": ["headache", "migraine", "sar dard", "chakkar", "fits", "seizure", "stroke", "nerve pain", "vertigo", "paralysis"],
    },
    {
        "name": "Pediatrician",
        "degrees": ["MBBS, MD (Pediatrics)", "MBBS, DCH, MD (Pediatrics)", "MBBS, DNB (Pediatrics)"],
        "tags": ["Child Vaccination", "Infant Nutrition", "Childhood Asthma", "Growth Monitoring", "Neonatal Care"],
        "diseases": ["child fever", "baby", "bachha", "magu", "pillalu", "vaccination", "colic", "wheezing", "ear pain"],
    },
    {
        "name": "Orthopedic Surgeon",
        "degrees": ["MBBS, MS (Orthopedics)", "MBBS, DNB (Orthopedics)", "MBBS, MS (Ortho), Fellowship"],
        "tags": ["Knee Replacement", "Joint Pain & Arthritis", "Fracture Management", "Sports Injury", "Spine Surgery"],
        "diseases": ["knee pain", "joint pain", "fracture", "back pain", "shoulder pain", "arthritis", "ghutna dard", "haddi"],
    },
    {
        "name": "Cardiologist",
        "degrees": ["MBBS, MD, DM (Cardiology)", "MBBS, DNB (Cardiology)", "MBBS, MD (Medicine), DM (Cardiology)"],
        "tags": ["Heart Disease & Angina", "Angioplasty Follow-up", "ECG & Echo", "Cholesterol Management", "Pacemaker Clinic"],
        "diseases": ["heart", "dil", "chest pain", "seene me dard", "palpitation", "cholesterol", "bp", "gunde"],
    },
    {
        "name": "Dermatologist",
        "degrees": ["MBBS, MD (Dermatology)", "MBBS, DVD, MD (Skin)", "MBBS, DNB (Dermatology)"],
        "tags": ["Acne & Pimples", "Eczema & Psoriasis", "Hair Loss Treatment", "Skin Allergy", "Laser Treatment"],
        "diseases": ["skin", "rash", "pimple", "acne", "allergy", "hair loss", "itching", "khujli", "baal"],
    },
    {
        "name": "ENT Specialist",
        "degrees": ["MBBS, MS (ENT)", "MBBS, DNB (ENT)", "MBBS, DLO, MS (ENT)"],
        "tags": ["Sinusitis & Nasal Block", "Ear Infection", "Tonsillitis", "Hearing Loss", "Voice Disorders"],
        "diseases": ["ear pain", "throat", "nose block", "sinus", "tonsil", "hearing", "kaan dard", "gala"],
    },
    {
        "name": "Ophthalmologist",
        "degrees": ["MBBS, MS (Ophthalmology)", "MBBS, DO, DNB (Ophth)", "MBBS, MS (Eye)"],
        "tags": ["Cataract Surgery", "LASIK & Vision Correction", "Glaucoma Treatment", "Retina Care", "Eye Allergy"],
        "diseases": ["eye pain", "vision", "cataract", "glasses", "aankh", "nazar", "motiyabind"],
    },
    {
        "name": "Gynecologist",
        "degrees": ["MBBS, MS (OBG)", "MBBS, MD (Obstetrics & Gynecology)", "MBBS, DNB (OBG)"],
        "tags": ["Pregnancy Care", "PCOS Treatment", "Menstrual Disorders", "Infertility", "Laparoscopic Surgery"],
        "diseases": ["pregnancy", "periods", "PCOS", "mahavari", "garbha", "infertility", "women health"],
    },
    {
        "name": "Psychiatrist",
        "degrees": ["MBBS, MD (Psychiatry)", "MBBS, DNB (Psychiatry)", "MBBS, DPM, MD (Psychiatry)"],
        "tags": ["Depression & Anxiety", "Sleep Disorders", "Stress Management", "OCD Treatment", "Addiction Counseling"],
        "diseases": ["depression", "anxiety", "sleep problem", "neend", "stress", "tension", "panic", "mental health"],
    },
    {
        "name": "Pulmonologist",
        "degrees": ["MBBS, MD (Pulmonary Medicine)", "MBBS, DNB (Respiratory)", "MBBS, DTCD, MD (Chest)"],
        "tags": ["Asthma & COPD", "TB Treatment", "Lung Infection", "Sleep Apnea", "Allergy & Breathing"],
        "diseases": ["breathing", "saans", "asthma", "TB", "cough", "lung", "wheezing", "phephda"],
    },
    {
        "name": "Gastroenterologist",
        "degrees": ["MBBS, MD, DM (Gastro)", "MBBS, DNB (Gastroenterology)", "MBBS, MD (Medicine), DM (GI)"],
        "tags": ["Acidity & GERD", "IBS & Colitis", "Liver Disease", "Endoscopy", "Gallstone Treatment"],
        "diseases": ["pet dard", "stomach", "acidity", "gas", "liver", "vomiting", "ulti", "kabz", "constipation"],
    },
    {
        "name": "Urologist",
        "degrees": ["MBBS, MS, MCh (Urology)", "MBBS, DNB (Urology)", "MBBS, MS (Surgery), MCh (Urology)"],
        "tags": ["Kidney Stones", "Prostate Treatment", "UTI Management", "Kidney Disease", "Bladder Issues"],
        "diseases": ["kidney", "stone", "urine problem", "peshab", "prostate", "UTI", "gurda"],
    },
    {
        "name": "Endocrinologist",
        "degrees": ["MBBS, MD, DM (Endocrinology)", "MBBS, DNB (Endocrinology)", "MBBS, MD (Medicine), DM (Endo)"],
        "tags": ["Diabetes (Type 1 & 2)", "Thyroid Disorders", "Hormone Imbalance", "PCOS Hormonal", "Obesity Management"],
        "diseases": ["diabetes", "sugar", "thyroid", "hormone", "obesity", "weight", "insulin"],
    },
    {
        "name": "Oncologist",
        "degrees": ["MBBS, MD, DM (Oncology)", "MBBS, DNB (Medical Oncology)", "MBBS, MD (Radiation Oncology)"],
        "tags": ["Cancer Screening", "Chemotherapy", "Radiation Therapy", "Tumor Surgery Follow-up", "Palliative Care"],
        "diseases": ["cancer", "tumor", "lump", "biopsy", "chemo", "rasauli"],
    },
]

FIRST_NAMES_MALE = [
    "Ramesh", "Suresh", "Rajesh", "Amit", "Vikram", "Arun", "Sanjay", "Manoj", "Vivek", "Ashok",
    "Kiran", "Prakash", "Venkatesh", "Harish", "Ganesh", "Mohan", "Ravi", "Srinivas", "Narayan", "Deepak",
    "Nitin", "Rohit", "Sachin", "Akash", "Rahul", "Ajay", "Vijay", "Dinesh", "Yogesh", "Pankaj",
    "Arvind", "Girish", "Mahesh", "Naveen", "Prasad", "Shashank", "Vishal", "Anand", "Chandra", "Gopal",
]

FIRST_NAMES_FEMALE = [
    "Priya", "Lakshmi", "Ananya", "Kavitha", "Swathi", "Deepa", "Meera", "Nandini", "Pooja", "Rekha",
    "Savitha", "Sunitha", "Asha", "Bhavana", "Chitra", "Divya", "Geetha", "Hema", "Indira", "Jyothi",
    "Kamala", "Latha", "Mamatha", "Nithya", "Padma", "Radha", "Saroja", "Sowmya", "Tanuja", "Usha",
    "Varsha", "Yamuna", "Aruna", "Brinda", "Chandrika", "Durga", "Fatima", "Gayathri", "Harini", "Ishita",
]

LAST_NAMES = [
    "Kumar", "Sharma", "Patel", "Reddy", "Nair", "Iyer", "Gowda", "Rao", "Gupta", "Singh",
    "Joshi", "Verma", "Desai", "Kulkarni", "Menon", "Pillai", "Hegde", "Shetty", "Bhat", "Agarwal",
    "Mishra", "Pandey", "Kapoor", "Mehta", "Shah", "Thakur", "Rajan", "Prasad", "Das", "Mukherjee",
    "Banerjee", "Chowdhury", "Saxena", "Malhotra", "Khanna", "Bose", "Sen", "Nath", "Dutta", "Chauhan",
]

WHY_BEST_TEMPLATES = [
    "Known for patient, empathetic consultations with thorough explanations",
    "Prescribes affordable generic medicines; avoids unnecessary tests",
    "Multilingual communication for patient comfort across languages",
    "Consistently rated 5 stars for minimal wait times",
    "Specialist training from premier Indian medical institutes",
    "Renowned for accurate diagnosis with minimal investigations",
    "Active in community health awareness and free health camps",
    "Uses latest evidence-based treatment protocols",
    "Warm bedside manner that puts anxious patients at ease",
    "Extensive experience with complex and referred cases",
]

TRUST_BADGE_TEMPLATES = [
    "Medical Council Verified",
    "Top Rated {year}",
    "Premier Institute Alumnus",
    "Affordable Care Champion",
    "Patient Choice Award",
    "Clinical Excellence {year}",
]

AVATAR_URLS = [
    "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=250",
    "https://images.unsplash.com/photo-1594824813576-9c471c691376?w=250",
    "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=250",
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=250",
    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=250",
    "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=250",
    "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=250",
    "https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=250",
]

SLOT_OPTIONS = [
    ["09:00 AM", "10:30 AM", "02:00 PM", "04:30 PM", "06:00 PM"],
    ["09:30 AM", "11:00 AM", "01:30 PM", "03:30 PM", "05:30 PM"],
    ["10:00 AM", "11:30 AM", "02:00 PM", "05:00 PM", "06:30 PM"],
    ["10:00 AM", "12:00 PM", "03:00 PM", "05:00 PM"],
    ["09:00 AM", "11:00 AM", "04:00 PM", "06:00 PM"],
]


def generate_all_doctors():
    """Generate ~1000 doctors across 4 cities."""
    doctors = []
    doc_counter = 7  # Start after hand-crafted docs (doc-001 to doc-006)

    today = datetime.now()
    available_dates = [(today + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(1, 8)]

    for city_name, city_data in CITIES.items():
        neighborhoods = city_data["neighborhoods"]
        hospitals = city_data["hospitals"]
        city_langs = city_data["languages"]

        for i in range(250):
            spec = random.choice(SPECIALTIES)
            hood = neighborhoods[i % len(neighborhoods)]
            hosp = hospitals[i % len(hospitals)]
            is_female = random.random() < 0.4
            first = random.choice(FIRST_NAMES_FEMALE if is_female else FIRST_NAMES_MALE)
            last = random.choice(LAST_NAMES)
            name = f"Dr. {first} {last}"
            degree = random.choice(spec["degrees"])

            rating = round(random.uniform(4.0, 5.0), 2)
            exp_years = random.randint(3, 25)
            fee = random.choice([200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200, 1500])
            dist_km = round(random.uniform(0.5, 15.0), 1)
            travel_min = max(2, int(dist_km * 2.5))
            review_count = random.randint(50, 1500)
            patients = random.randint(2000, 30000)

            # Slight coordinate jitter for uniqueness
            lat = round(hood["lat"] + random.uniform(-0.015, 0.015), 4)
            lng = round(hood["lng"] + random.uniform(-0.015, 0.015), 4)

            doc_id = f"doc-{doc_counter:04d}"
            doc_counter += 1

            doc = {
                "id": doc_id,
                "name": name,
                "degrees": degree,
                "speciality": spec["name"],
                "hospital": f"{hosp}, {hood['area']}",
                "landmark": hood["landmark"],
                "city": city_name,
                "distance": f"{dist_km} km away",
                "distance_km": dist_km,
                "travel_time": f"{travel_min} mins",
                "coordinates": {"lat": lat, "lng": lng},
                "map_directions": [
                    f"Head toward {hood['area']} main road ({random.randint(2,8)*100} m)",
                    f"Turn at {hood['landmark']} ({random.randint(3,10)*100} m)",
                    f"{hosp} OPD entrance on your right ({random.randint(2,5)*100} m)",
                ],
                "rating": rating,
                "review_count": review_count,
                "experience": f"{exp_years}+ years",
                "patients_treated": f"{patients:,}+",
                "fee": f"₹{fee}",
                "languages": city_langs if random.random() < 0.7 else city_langs + ["en"],
                "expertise_tags": spec["tags"][:random.randint(3, 5)],
                "diseases_treated": spec["diseases"],
                "why_best": random.sample(WHY_BEST_TEMPLATES, min(3, len(WHY_BEST_TEMPLATES))),
                "top_reviews": [
                    {
                        "patient": f"{random.choice(FIRST_NAMES_MALE)} {random.choice(LAST_NAMES)}",
                        "city": city_name,
                        "rating": 5,
                        "text": f"Excellent doctor. Very thorough consultation and genuine care. Highly recommended in {hood['area']}.",
                        "date": f"{random.randint(1,14)} days ago",
                    }
                ],
                "trust_badges": [
                    t.format(year="2026") for t in random.sample(TRUST_BADGE_TEMPLATES, 2)
                ],
                "available_dates": available_dates[:random.randint(3, 7)],
                "slots": random.choice(SLOT_OPTIONS),
                "avatar": random.choice(AVATAR_URLS),
            }
            doctors.append(doc)

    return doctors
