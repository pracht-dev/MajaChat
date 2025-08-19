# Configuration via python-decouple.
# Reads from environment variables or a local .env file if present.

from decouple import config

# Which implementation to use: "local" (faster-whisper) or "openai"
TRANSCRIBER = config("TRANSCRIBER", default="local")

#  Local Whisper model size (tiny, base, small, medium, large)
WHISPER_MODEL = config("WHISPER_MODEL", default="small")

OPENAI_API_KEY = config("OPENAI_API_KEY")
OPENAI_ORG = config("OPENAI_ORG")
