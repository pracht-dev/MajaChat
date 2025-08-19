from __future__ import annotations

from typing import Any

from openai import OpenAI

from functions.config import OPENAI_API_KEY
from functions.transcription import TranscriptionService


class OpenAITranscriptionService(TranscriptionService):
    """
    Adapter: Cloud transcription using OpenAI's Whisper API.
    Input is always an UploadFile from the React frontend.
    """

    def __init__(self):
        api_key = OPENAI_API_KEY
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY not set, but TRANSCRIBER=openai was selected.")
        self.client = OpenAI(api_key=api_key)
        self.model = "whisper-1"

    def transcribe(self, audio_file: Any) -> str | None:
        """
        Accepts a FastAPI UploadFile directly (coming from the React frontend).
        Returns the transcript text, or None on error.
        """
        try:
            # UploadFile has .file (SpooledTemporaryFile), which behaves like a binary file object
            # later for react
            # audio_file.file.seek(0)  # make sure pointer is at the beginning

            transcript = self.client.audio.transcriptions.create(
                model=self.model,
                file=audio_file
            )
            return getattr(transcript, "text", None)

        except Exception as e:
            print(f"[OpenAITranscriptionService] Error: {e}")
            return None