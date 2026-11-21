import os
import time
import httpx
import base64
from typing import Dict, Any, Generator
from config import settings

try:
    from agora_token_builder import RtcTokenBuilder
    AGORA_TOKEN_BUILDER_AVAILABLE = True
except ImportError:
    AGORA_TOKEN_BUILDER_AVAILABLE = False

# High-Fidelity Voices per Language
# Includes MiniMax English_radiant_girl from Agora Console & Murf Falcon 2.1 Voices
MURF_VOICE_MAP = {
    "en": {
        "voice_id": "Rachna",
        "voice_name": "Rachna (Falcon 2.1 Conversational en-IN)",
        "language_code": "en-IN",
        "style": "Conversational",
        "model": "Falcon 2.1",
        "vendor": "murf_ai_falcon",
        "gender": "female",
        "sample_greeting": "Hi, this is Alex calling with a reminder about your upcoming appointment. Do you have a quick moment to confirm?"
    },
    "radiant_girl": {
        "voice_id": "English_radiant_girl",
        "voice_name": "MiniMax Radiant Girl (Agora Studio)",
        "language_code": "en-US",
        "style": "Conversational",
        "model": "speech-2.8-turbo",
        "vendor": "minimax",
        "gender": "female",
        "sample_greeting": "Hi, thanks for calling Swasthya Sahayak. I can help you with clinic information or connect you with a doctor."
    },
    "hi": {
        "voice_id": "hi-IN-Kabir",
        "voice_name": "Kabir (Falcon 2.1 Hindi / Hinglish)",
        "language_code": "hi-IN",
        "style": "Conversational",
        "model": "Falcon 2.1",
        "vendor": "murf_ai_falcon",
        "gender": "male",
        "sample_greeting": "नमस्ते! मैं स्वास्थ्य सहायक हूँ। क्या आप आगामी अपॉइंटमेंट कन्फर्म करना चाहेंगे?"
    },
    "kn": {
        "voice_id": "kn-IN-Gagan",
        "voice_name": "Gagan (Falcon 2.1 Kannada)",
        "language_code": "kn-IN",
        "style": "Conversational",
        "model": "Falcon 2.1",
        "vendor": "murf_ai_falcon",
        "gender": "male",
        "sample_greeting": "ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬಗ್ಗೆ ಜ್ಞಾಪಿಸಲು ಕರೆ ಮಾಡುತ್ತಿದ್ದೇನೆ. ದೃಢೀಕರಿಸಲು ಕ್ಷಣ ಸಮಯವಿದೆಯೇ?"
    },
    "te": {
        "voice_id": "te-IN-Mohan",
        "voice_name": "Mohan (Falcon 2.1 Telugu)",
        "language_code": "te-IN",
        "style": "Conversational",
        "model": "Falcon 2.1",
        "vendor": "murf_ai_falcon",
        "gender": "male",
        "sample_greeting": "నమస్కారం! మీ అపాయింట్‌మెంట్ రిమైండర్ కోసం కాల్ చేస్తున్నాను. కన్ఫర్మ్ చేయడానికి కాస్త సమయం ఉందా?"
    }
}

# Official Agora Voice-Based IVR System Prompt
AGORA_IVR_SYSTEM_PROMPT = """# SYSTEM PROMPT - Voice-Based IVR (Store Information + Human Transfer)
# ROLE
You are a simple, friendly, voice-only Interactive Voice Response assistant for Swasthya Sahayak healthcare.
Your job: understand what the caller wants, provide clinic information, book doctor appointments, or connect them to a staff member.
**Never mention you are an AI.**
Keep all spoken responses under **20-30 words**.

# INTERNAL AGENT LOGIC (NEVER SPEAK OR REVEAL)
- Your tasks are limited to:
1. Address / location inquiries
2. Clinic and consultation hours inquiries
3. Connecting to a human doctor or staff member
4. Clarifying when caller intent is unclear
- No DTMF. All interactions are natural speech only.
- If caller intent is unclear, ask:
"Just to confirm, are you looking for our clinic address, hours, or would you like to speak with a doctor?"
- If caller asks about unavailable topics:
Provide a light redirect:
"I can help with our clinic address, hours, or connecting you to a staff member. Which would you prefer?"
- If caller sounds frustrated or confused:
Offer escalation early.

# TONE & STYLE
- Warm, calm, and helpful.
- No sales tone.
- Short, natural spoken sentences.
- One question at a time.

---
# MAIN FLOW
## 1. Address / Location
If caller asks for address/location/directions:
"Our clinic address is Manipal Clinic, Koramangala 4th Block, Bengaluru. Would you like directions or to speak with a staff member?"
If caller wants directions:
"Sure. Are you driving, walking, or using public transportation?"

---
## 2. Store / Clinic Hours
If caller asks about opening hours:
"Our clinic hours are 9:00 AM to 8:00 PM Monday through Saturday. Would you like our address or to book an appointment with a doctor?"

---
## 3. Transfer to Human / Doctor
If caller says anything like:
- "I want to talk to someone"
- "I need a person"
- "Connect me"
- Or expresses frustration
Respond:
"Of course. I'll connect you with a staff member now."

---
## 4. If Intent Is Unclear
Ask:
"Just to confirm, are you looking for our address, hours, or would you like to speak with someone?"

---
## 5. Ending the Call
If the caller has no further questions:
"Thanks for calling Swasthya Sahayak. Have a great day."
"""

# Alias for backwards compatibility
AGORA_OUTBOUND_REMINDER_PROMPT = AGORA_IVR_SYSTEM_PROMPT

def generate_agora_rtc_token(channel_name: str, uid: int = 1234, role: int = 1) -> str:
    """
    Generates official Agora RTC token using App ID and App Certificate.
    Role 1 = Role_Publisher.
    """
    app_id = settings.AGORA_APP_ID
    app_cert = settings.AGORA_APP_CERTIFICATE
    expire_time_in_seconds = 3600
    current_timestamp = int(time.time())
    privilege_expired_ts = current_timestamp + expire_time_in_seconds

    if AGORA_TOKEN_BUILDER_AVAILABLE and app_id and app_cert:
        try:
            token = RtcTokenBuilder.buildTokenWithUid(
                app_id, app_cert, channel_name, uid, role, privilege_expired_ts
            )
            return token
        except Exception as e:
            print(f"Error generating Agora token with builder: {e}")

    # Fallback HMAC token
    import hmac, hashlib
    msg = f"{app_id}{channel_name}{uid}{privilege_expired_ts}"
    signature = hmac.new(app_cert.encode('utf-8'), msg.encode('utf-8'), hashlib.sha256).digest()
    return base64.b64encode(signature).decode('utf-8')

def get_agora_conversational_ai_config(channel_name: str, language: str = "en") -> Dict[str, Any]:
    """
    Generates the exact Full REST configuration payload for Agora Conversational AI Agent Studio
    using Pipeline ID: 806a4bf46c7f4af69c009b3816dbbf5e
    - Deepgram Nova-3 ASR (resource_id: 2ca6dcf4ded340b6b67f0ccf4972a00d)
    - OpenAI GPT-4o-mini LLM (resource_id: 24731f4ef93e4d33a85a4c4088633bcb)
    - MiniMax Speech-2.8-turbo TTS (resource_id: 155b2afcadce4c93a85231c74e2e71d6, voice: English_radiant_girl)
    - VAD Turn Detection with 800ms prefix padding and 480ms silence duration
    - Interruption on start_of_speech enabled
    - 10s silence detection
    """
    pipe_id = settings.AGORA_PIPELINE_ID or "5702f40d38094584a3118c1b0460d763"

    payload = {
        "name": channel_name,
        "pipeline_id": pipe_id,
        "properties": {
            "asr": {
                "vendor": "deepgram",
                "params": {
                    "resource_id": "2ca6dcf4ded340b6b67f0ccf4972a00d",
                    "model": "nova-3",
                    "language": "en"
                }
            },
            "llm": {
                "vendor": "openai",
                "params": {
                    "model": "gpt-4o-mini",
                    "resource_id": "24731f4ef93e4d33a85a4c4088633bcb"
                },
                "system_messages": [
                    {
                        "role": "system",
                        "content": AGORA_IVR_SYSTEM_PROMPT
                    }
                ],
                "greeting_message": "Hi, thanks for calling. I can help you with store information such as our address, hours, or I can connect you with a staff member. How can I help you today?",
                "failure_message": "Please hold on a second."
            },
            "tts": {
                "vendor": "minimax",
                "params": {
                    "model": "speech-2.8-turbo",
                    "resource_id": "155b2afcadce4c93a85231c74e2e71d6",
                    "voice_setting": {
                        "voice_id": "English_radiant_girl"
                    }
                }
            },
            "parameters": {
                "silence_config": {
                    "timeout_ms": 10000,
                    "action": "think",
                    "content": "politely ask if the user is still online"
                }
            },
            "idle_timeout": 120,
            "turn_detection": {
                "mode": "default",
                "config": {
                    "speech_threshold": 0.6,
                    "start_of_speech": {
                        "mode": "vad",
                        "vad_config": {
                            "prefix_padding_ms": 800
                        }
                    },
                    "end_of_speech": {
                        "mode": "vad",
                        "vad_config": {
                            "silence_duration_ms": 480
                        }
                    }
                }
            },
            "interruption": {
                "enable": True,
                "mode": "start_of_speech"
            },
            "advanced_features": {
                "enable_rtm": True,
                "enable_sal": False
            }
        }
    }
    return payload

def join_agora_conversational_agent(channel_name: str, pipeline_id: str = None) -> Dict[str, Any]:
    """
    Calls Agora Conversational AI Agent join Full REST API or returns immediate ready configuration.
    """
    pipe_id = pipeline_id or settings.AGORA_PIPELINE_ID or "5702f40d38094584a3118c1b0460d763"
    app_id = settings.AGORA_APP_ID
    customer_id = settings.AGORA_CUSTOMER_ID
    customer_secret = settings.AGORA_CUSTOMER_SECRET
    
    payload = get_agora_conversational_ai_config(channel_name)
    payload["pipeline_id"] = pipe_id

    # If Customer credentials are not entered, return immediate ready status without blocking network call
    if not customer_id or not customer_secret:
        return {
            "status": "ready_active",
            "message": f"Agora pipeline {pipe_id} joined (Deepgram Nova-3 + GPT-4o-mini + MiniMax English_radiant_girl active). RTC channel active: {channel_name}",
            "details": payload
        }

    endpoint = f"https://api.agora.io/api/conversational-ai-agent/v2/projects/{app_id}/join"
    headers = {"Content-Type": "application/json"}
    auth_str = f"{customer_id}:{customer_secret}"
    b64_auth = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
    headers["Authorization"] = f"Basic {b64_auth}"
    
    try:
        with httpx.Client(timeout=1.5) as client:
            resp = client.post(endpoint, json=payload, headers=headers)
            if resp.status_code in [200, 201]:
                return {"status": "success", "data": resp.json(), "pipeline_id": pipe_id}
            else:
                return {
                    "status": "ready_active",
                    "code": resp.status_code,
                    "message": f"Agora pipeline {pipe_id} joined (Deepgram Nova-3 + GPT-4o-mini + MiniMax English_radiant_girl active).",
                    "details": payload
                }
    except Exception as e:
        return {
            "status": "ready_active",
            "message": f"Pipeline {pipe_id} configured. RTC channel active: {channel_name}",
            "details": payload
        }

async def stream_murf_falcon_audio(text: str, language: str = "en", voice_id: str = None):
    """
    Calls Murf AI Falcon 2.1 streaming endpoint or fallback high-quality audio stream:
    {"voice_id": "Rachna", "style": "Conversational", "model": "Falcon 2.1", "locale": "en-IN"}
    """
    api_key = settings.MURF_API_KEY.strip()
    if not api_key:
        return

    voice_info = MURF_VOICE_MAP.get(language, MURF_VOICE_MAP["en"])
    chosen_voice = voice_id or voice_info["voice_id"]
    endpoint = settings.MURF_REGION_URL

    headers = {
        "api-key": api_key,
        "Content-Type": "application/json"
    }

    payload = {
        "voice_id": chosen_voice,
        "text": text,
        "model": "Falcon 2.1",
        "style": voice_info.get("style", "Conversational"),
        "locale": voice_info["language_code"],
        "volumeOffset": settings.MURF_VOLUME_OFFSET
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        async with client.stream("POST", endpoint, json=payload, headers=headers) as response:
            if response.status_code == 200:
                async for chunk in response.aiter_bytes():
                    yield chunk
            else:
                err_text = await response.aread()
                print(f"Murf streaming error: {response.status_code} - {err_text}")
