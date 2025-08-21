from __future__ import annotations

from typing import Any

from openai import OpenAI

from database import MessageStore
from services.config import OPENAI_API_KEY
from services.transcription import TranscriptionService


class OpenAITranscriptionService(TranscriptionService):
    """
    Adapter: Cloud transcription using OpenAI's Whisper API.
    Input is always an UploadFile from the React frontend.
    """

    def __init__(self, msg_store: MessageStore):
        api_key = OPENAI_API_KEY
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY not set, but TRANSCRIBER=openai was selected.")
        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4o-mini-transcribe"
        self._msg_store = msg_store

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

    # OpenAI - ChatGPT
    # Get Response to our message
    def get_chatgpt_response(self, message_input):
        messages = self._msg_store.get_recent_messages()
        user_message = {"role": "user", "content": message_input}
        messages.append(user_message)
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages
            )
            return response.choices[0].message.content

        except Exception as e:
            print(f"[OpenAITranscriptionService] Error: {e}")
            return None
