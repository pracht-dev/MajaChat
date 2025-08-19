# Main Imports
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from functions.transcriber_gemini import GeminiTranscriptionService
from functions.transcriber_local import LocalWhisperTranscriptionService

# Custom Function Imports

# ...

app = FastAPI(title="MajaChat API", version="0.1.0")
# transcribe = GeminiTranscriptionService()
transcribe = LocalWhisperTranscriptionService()
# transcribe = OpenAITranscriptionService()

# CORS - Origins
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:4173",
    "http://localhost:4174",
    "http://localhost:3000",
]

# CORS - Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# health check
@app.get("/health")
async def check_health():
    return {"status": "ok"}


# Get audio
@app.post("/post-audio-get/")
async def get_audio():
    with open("voice.mp3", "rb") as audio_input:
        message_transcribed = transcribe.transcribe(audio_input)
    return message_transcribed

# Post bot response
# Note: Not playing in the browser when using POST
# @app.post("/post-audio/")
# async def post_audio(file: UploadFile = File(...)):
#     print(file.filename)
