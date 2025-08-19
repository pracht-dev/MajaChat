# functionen/transcriber_local.py
import os
import tempfile
from typing import Any

from faster_whisper import WhisperModel

from functions.config import WHISPER_MODEL


class LocalWhisperTranscriptionService:
    """
    Local transcription using faster-whisper.
    Accepts a binary file-like object (e.g. from open("file.mp3", "rb")).
    """

    def __init__(self):
        # Use automatic device selection to avoid unsupported devices like 'mps'.
        self.model = WhisperModel(WHISPER_MODEL, device="auto")

    def transcribe(self, audio_file: Any) -> str:
        # Save the file-like object to a temporary file for whisper to read
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            tmp.write(audio_file.read())
            tmp_path = tmp.name

        try:
            segments, _ = self.model.transcribe(tmp_path, beam_size=5)
            return " ".join(s.text for s in segments).strip()
        finally:
            os.remove(tmp_path)