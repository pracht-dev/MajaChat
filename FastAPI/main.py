# Main Imports
import os
from http.client import HTTPException

from elevenlabs import text_to_speech
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import StreamingResponse

from database import store_messages, reset_messages
from functions.text_to_speech import TextToSpeech
from functions.transcriber_openai import OpenAITranscriptionService

# Custom Function Imports

# ...

app = FastAPI(title="MajaChat API", version="0.1.0")
# transcribe = GeminiTranscriptionService()
# transcribe = LocalWhisperTranscriptionService()
transcribe = OpenAITranscriptionService()
text_to_speech = TextToSpeech()

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


@app.get("/reset-conversation")
async def reset_conversation():
    reset_messages()
    return {"message": "Conversation reset successfully."}


# Get audio
@app.post("/post-audio")
async def post_audio(file: UploadFile = File(...)):

    #  Save file from frontend
    with open(file.filename, "wb") as buffer:
        buffer.write(file.file.read())
    audio_input = open(file.filename, "rb")

    # Decode audio
    message_transcribed = transcribe.transcribe(audio_input)
    if not message_transcribed:
        return HTTPException(status_code=400, detail="Error transcribing audio")
    # Remove file from disk
    os.remove(file.filename)

    # Get ChatGPT response
    chat_response = transcribe.get_chatgpt_response(message_transcribed)
    if not chat_response:
        return HTTPException(status_code=400, detail="Error getting ChatGPT response")

    # Store messages
    store_messages(message_transcribed, chat_response)

    # Convert chat_response to audio
    audio_output = text_to_speech.convert_to_speech(chat_response)
    if not audio_output:
        return HTTPException(status_code=400, detail="Error converting text to speech")


    return StreamingResponse(audio_output, media_type="application/octet-stream")
