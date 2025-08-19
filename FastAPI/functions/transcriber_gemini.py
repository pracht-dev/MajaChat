from __future__ import annotations

import io
from typing import Any

from google import genai
from google.genai import types

from functions.config import GEMINI_API_KEY  # füge diese Konstante zu deiner config hinzu (oder nutze Env)
from functions.transcription import TranscriptionService


class GeminiTranscriptionService(TranscriptionService):
    """
    Adapter: Cloud transcription using Google's Gemini API.
    Uploads the audio to Google first (Files API), then references it by URI.
    """

    def __init__(self):
        key = GEMINI_API_KEY
        if not key:
            raise RuntimeError("GEMINI_API_KEY not set, but TRANSCRIBER=gemini was selected.")
        self.client = genai.Client(api_key=key)
        self.model = "gemini-2.5-flash"

    def transcribe(self, audio_file: Any) -> str | None:
        try:

            prompt = "Transcribe the audio verbatim with punctuation. Keep original language."
            resp = self.client.models.generate_content(
                model=self.model,
                contents=[prompt, types.Part.from_bytes(
                    data = audio_file.read(),
                    mime_type="audio/mp3"
                )],
            )

            text = getattr(resp, "text", None)
            return text if text else None

        except Exception as e:
            print(f"[GeminiTranscriptionService] Error: {e}")
            return None
