# Configuration via python-decouple.
# Reads from environment variables or a local .env file if present.

from decouple import config

# Which implementation to use: "local" (faster-whisper) or "openai"
TRANSCRIBER = config("TRANSCRIBER", default="local")

#  Local Whisper model size (tiny, base, small, medium, large)
WHISPER_MODEL = config("WHISPER_MODEL", default="small")

# OpenAI API key and organization
OPENAI_API_KEY = config("OPENAI_API_KEY")
OPENAI_ORG = config("OPENAI_ORG")

# Google Gemini API key
GEMINI_API_KEY = config("GEMINI_API_KEY")

# ElevenLabs API key
ELEVENLABS_API_KEY = config("ELEVENLABS_API_KEY")
