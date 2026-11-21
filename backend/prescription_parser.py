from typing import Optional, Dict, Any
from datetime import datetime
import base64
import json
import re
import io

import httpx

from config import settings


def _normalise_prescription(data: Dict[str, Any]) -> Dict[str, Any]:
    medicines = data.get("medicines") if isinstance(data.get("medicines"), list) else []
    normalised_medicines = []

    for medicine in medicines:
        if not isinstance(medicine, dict):
            continue
        name = str(medicine.get("name") or "Medicine not identified").strip()
        dosage = str(medicine.get("dosage") or "Dose not identified").strip()
        duration = str(medicine.get("duration") or "Duration not identified").strip()
        times = medicine.get("reminder_times")
        if not isinstance(times, list):
            times = []
        times = [str(time).strip() for time in times if str(time).strip()]

        voice = medicine.get("voice_instruction")
        if not isinstance(voice, dict):
            voice = {}
        voice = {lang: str(text).strip() for lang, text in voice.items() if text}
        if "en" not in voice:
            voice["en"] = f"Take {name}. Dosage: {dosage}. Duration: {duration}."

        normalised_medicines.append({
            "name": name,
            "dosage": dosage,
            "duration": duration,
            "reminder_times": times,
            "voice_instruction": voice,
        })

    result = {
        "id": str(data.get("id") or f"RX-{datetime.now().strftime('%Y%m%d%H%M%S')}"),
        "doctor_name": str(data.get("doctor_name") or "Doctor name not identified"),
        "patient_name": str(data.get("patient_name") or "Patient name not identified"),
        "date": str(data.get("date") or datetime.now().strftime("%Y-%m-%d")),
        "diagnosis": str(data.get("diagnosis") or "Diagnosis not identified"),
        "advice": str(data.get("advice") or ""),
        "medicines": normalised_medicines,
        "scan_timestamp": datetime.now().isoformat(),
        "status": "ANALYSIS_COMPLETE",
    }
    return result


def _extract_json(content: str) -> Optional[Dict[str, Any]]:
    content = content.strip()
    try:
        parsed = json.loads(content)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", content)
        if match:
            try:
                parsed = json.loads(match.group(0))
                return parsed if isinstance(parsed, dict) else None
            except json.JSONDecodeError:
                return None


def _extract_text_locally(image_bytes: bytes, mime_type: str) -> str:
    try:
        from PIL import Image, ImageEnhance, ImageFilter

        if mime_type == "application/pdf":
            try:
                import fitz
                pdf = fitz.open(stream=image_bytes, filetype="pdf")
                texts = []
                for page in pdf:
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
                    text = _extract_text_locally(pix.tobytes("png"), "image/png")
                    if text:
                        texts.append(text)
                return "\n".join(texts)
            except ImportError:
                return ""

        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image.thumbnail((1800, 1800))
        image = ImageEnhance.Contrast(image).enhance(1.5)
        image = image.filter(ImageFilter.SHARPEN)

        try:
            import easyocr
            import numpy as np
            reader = easyocr.Reader(["en"], gpu=False, verbose=False)
            results = reader.readtext(np.array(image))
            return "\n".join(str(item[1]).strip() for item in results if len(item) > 1)
        except ImportError:
            return ""
    except Exception:
        return ""


def _parse_ocr_text(text: str) -> Dict[str, Any]:
    lines = [re.sub(r"\s+", " ", line).strip() for line in text.splitlines() if line.strip()]
    medicines = []

    for line in lines:
        if re.search(r"\btot(?:al)?\s*:", line, re.I):
            continue
        if not re.search(r"\b(tab|tablet|cap|capsule|syrup|inj|injection|drop|cream|ointment)\b", line, re.I):
            continue
        dosage_match = re.search(
            r"(?:\b\d+(?:\.\d+)?(?:/\d+)?\s*(?:mg|ml|mcg|g)\b|"
            r"\b(?:once|twice|thrice|daily|morning|night|before|after)\b)",
            line,
            re.I,
        )
        dosage = line if dosage_match else "Dose not identified"
        words = re.sub(r"^\d+[.)-]?\s*", "", line).split()[0:8]
        name = " ".join(words).strip(" -")
        if name:
            medicines.append({
                "name": name,
                "dosage": dosage,
                "duration": "Duration not identified",
                "reminder_times": [],
                "voice_instruction": {},
            })

    diagnosis = "Diagnosis not identified"
    for line in lines:
        if re.search(r"\b(diagnosis|diagnosed|impression|case)\b", line, re.I):
            diagnosis = re.sub(r"^[^:]*:\s*", "", line).strip()
            break

    advice = ""
    for line in lines:
        if re.search(r"\b(advice|advise|follow.?up|avoid)\b", line, re.I):
            advice = line
            break

    doctor_name = "Doctor name not identified"
    for line in lines[:8]:
        if re.search(r"\b(dr\.?|doctor|clinic|hospital)\b", line, re.I):
            doctor_name = line
            break

    return _normalise_prescription({
        "id": f"RX-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "doctor_name": doctor_name,
        "patient_name": "Patient name not identified",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "diagnosis": diagnosis,
        "advice": advice,
        "medicines": medicines,
    })


def _call_vision_api(image_bytes: bytes, mime_type: str) -> Optional[Dict[str, Any]]:
    encoded = base64.b64encode(image_bytes).decode("ascii")
    data_url = f"data:{mime_type};base64,{encoded}"
    instruction = (
        "Analyze this medical prescription image. Extract only facts visible in the image. "
        "Return strict JSON with: id, doctor_name, patient_name, date, diagnosis, advice, "
        "and medicines. Each medicine must contain name, dosage, duration, reminder_times "
        "(as human-readable strings such as '08:00 AM'), and voice_instruction for en, hi, kn, te. "
        "Do not invent or default to any sample prescription. If a field cannot be read, use "
        "'Not identified'."
    )

    if settings.OPENROUTER_API_KEY:
        try:
            response = httpx.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "google/gemini-2.0-flash-001",
                    "messages": [{
                        "role": "user",
                        "content": [
                            {"type": "text", "text": instruction},
                            {"type": "image_url", "image_url": {"url": data_url}},
                        ],
                    }],
                    "response_format": {"type": "json_object"},
                },
                timeout=45.0,
            )
            if response.status_code == 200:
                content = response.json()["choices"][0]["message"]["content"]
                parsed = _extract_json(content)
                if parsed:
                    return parsed
        except Exception:
            pass

    if settings.GROQ_API_KEY:
        try:
            response = httpx.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "meta-llama/llama-4-scout-17b-16e-instruct",
                    "messages": [{
                        "role": "user",
                        "content": [
                            {"type": "text", "text": instruction},
                            {"type": "image_url", "image_url": {"url": data_url}},
                        ],
                    }],
                    "response_format": {"type": "json_object"},
                },
                timeout=45.0,
            )
            if response.status_code == 200:
                content = response.json()["choices"][0]["message"]["content"]
                parsed = _extract_json(content)
                if parsed:
                    return parsed
        except Exception:
            pass

    return None


def scan_prescription_data(
    image_url: Optional[str] = None,
    text_content: Optional[str] = None,
    image_bytes: Optional[bytes] = None,
    mime_type: str = "image/jpeg",
) -> Dict[str, Any]:
    if image_bytes:
        parsed = _call_vision_api(image_bytes, mime_type)
        if parsed:
            return _normalise_prescription(parsed)

        local_text = _extract_text_locally(image_bytes, mime_type)
        if local_text:
            return _parse_ocr_text(local_text)

    if text_content:
        instruction = (
            "Extract the prescription details visible in this OCR text. Return strict JSON "
            "with doctor_name, patient_name, date, diagnosis, advice, and medicines "
            "(name, dosage, duration, reminder_times, voice_instruction). Do not invent values."
        )
        if settings.GROQ_API_KEY:
            try:
                response = httpx.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "system", "content": instruction},
                            {"role": "user", "content": text_content},
                        ],
                        "response_format": {"type": "json_object"},
                    },
                    timeout=30.0,
                )
                if response.status_code == 200:
                    content = response.json()["choices"][0]["message"]["content"]
                    parsed = _extract_json(content)
                    if parsed:
                        return _normalise_prescription(parsed)
            except Exception:
                pass

    raise ValueError(
        "The prescription image could not be analyzed. Check the image quality and API vision configuration."
    )
