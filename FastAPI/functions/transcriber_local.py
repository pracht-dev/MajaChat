# functionen/transcriber_local.py
from typing import Any

from faster_whisper import WhisperModel

from functions.config import WHISPER_MODEL
from functions.transcription import TranscriptionService


class LocalWhisperTranscriptionService(TranscriptionService):
    """
    Local transcription using faster-whisper.
    Accepts a binary file-like object (e.g. from open("file.mp3", "rb")).
    """

    def __init__(self):
        # Use automatic device selection to avoid unsupported devices like 'mps'.
        self.model = WhisperModel(WHISPER_MODEL, device="auto")

    def transcribe(self, audio_file: Any) -> str:

        try:
            segments, _ = self.model.transcribe(audio_file, beam_size=5)
            return " ".join(s.text for s in segments).strip()
        except Exception as e:
            print(f"[LocalWhisperTranscriptionService] Error: {e}")
            return None
