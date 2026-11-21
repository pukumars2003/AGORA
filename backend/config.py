import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Swasthya Sahayak (Arogya Vaani) - Voice AI for Bharat"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # Real Agora credentials from user console
    AGORA_APP_ID: str = os.getenv("AGORA_APP_ID", "690d39ee1c084e798abed55b51d264e7")
    AGORA_APP_CERTIFICATE: str = os.getenv("AGORA_APP_CERTIFICATE", "d8ed9190cc5841eeb69f16d6bd4220a1")
    AGORA_CUSTOMER_ID: str = os.getenv("AGORA_CUSTOMER_ID", "")
    AGORA_CUSTOMER_SECRET: str = os.getenv("AGORA_CUSTOMER_SECRET", "")
    
    # Agora Conversational AI Agent Studio Pipeline
    # User console pipeline: 5702f40d38094584a3118c1b0460d763
    AGORA_PIPELINE_ID: str = os.getenv("AGORA_PIPELINE_ID", "5702f40d38094584a3118c1b0460d763")
    AGORA_TTS_VENDOR: str = os.getenv("AGORA_TTS_VENDOR", "minimax")
    AGORA_TTS_VOICE: str = os.getenv("AGORA_TTS_VOICE", "English_radiant_girl")
    AGORA_ASR_VENDOR: str = os.getenv("AGORA_ASR_VENDOR", "deepgram")
    AGORA_ASR_MODEL: str = os.getenv("AGORA_ASR_MODEL", "nova-3")
    
    # Murf AI Falcon 2.1 settings
    # Updated with exact user specification: {"voice_id":"Rachna","style":"Conversational","model":"Falcon 2.1","locale":"en-IN"}
    MURF_API_KEY: str = os.getenv("MURF_API_KEY", "")
    MURF_MODEL: str = os.getenv("MURF_MODEL", "Falcon 2.1")
    MURF_VOICE_ID: str = os.getenv("MURF_VOICE_ID", "Rachna")
    MURF_STYLE: str = os.getenv("MURF_STYLE", "Conversational")
    MURF_LOCALE: str = os.getenv("MURF_LOCALE", "en-IN")
    MURF_REGION_URL: str = os.getenv("MURF_REGION_URL", "https://in.api.murf.ai/v1/speech/stream")
    MURF_VOLUME_OFFSET: int = int(os.getenv("MURF_VOLUME_OFFSET", "15"))
    
    # LLM Provider Keys
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    CEREBRAS_API_KEY: str = os.getenv("CEREBRAS_API_KEY", "")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Public base URL for Agora Agent Webhook
    PUBLIC_BACKEND_URL: str = os.getenv("PUBLIC_BACKEND_URL", "http://localhost:8000")

    class Config:
        env_file = [".env", "../.env"]
        extra = "allow"

settings = Settings()
