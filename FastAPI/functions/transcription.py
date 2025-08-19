from abc import ABC, abstractmethod
from typing import Any

from functions.config import TRANSCRIBER


class TranscriptionService(ABC):
    """Port/Interface: unified transcription API."""

    @abstractmethod
    def transcribe(self, audio_file: Any) -> str:
        """
        Accepts:
          - FastAPI UploadFile (has .file / .filename),
          - raw bytes / file-like objects,
          - or a filesystem path (str).
        Returns:
          - transcribed text (str).
        """
        ...

def make_transcriber() -> TranscriptionService:
    """
    Factory: chooses the adapter based on env/config (TRANSCRIBER).
    """
    if TRANSCRIBER == "openai":
        from transcriber_openai import OpenAITranscriptionService
        return OpenAITranscriptionService()
    # default: local faster-whisper
    from transcriber_local import LocalWhisperTranscriptionService
    return LocalWhisperTranscriptionService()