from __future__ import annotations

import json
import os
import random
import tempfile
import threading
from pathlib import Path
from typing import List, Dict, Optional

from services.model_role import ModelRoleService


class MessageStore:
    """
    Class-based message store:
      - dynamic system message (role + username)
      - file-backed history
      - safe concurrent writes
    """

    def __init__(
            self,
            model_service: Optional[ModelRoleService] = None,
            file_path: str | Path = "stored_data.json",
            history_limit: int = 5,
    ) -> None:
        self._model_service = model_service
        self._path = Path(file_path)
        self._limit = max(0, history_limit)
        self._lock = threading.Lock()
        if not self._path.exists():
            self._path.write_text("[]", encoding="utf-8")

    # ---------- private helpers ----------

    def _read(self) -> List[Dict]:
        with self._lock:
            try:
                data = json.loads(self._path.read_text(encoding="utf-8"))
                return data if isinstance(data, list) else []
            except Exception:
                return []

    def _atomic_write(self, items: List[Dict]) -> None:
        with self._lock:
            fd, tmp = tempfile.mkstemp(dir=str(self._path.parent))
            try:
                with os.fdopen(fd, "w", encoding="utf-8") as f:
                    json.dump(items, f, ensure_ascii=False, indent=4)
                os.replace(tmp, self._path)
            finally:
                try:
                    os.remove(tmp)
                except OSError:
                    pass

    def _current_role_prompt(self) -> str:
        if self._model_service:
            p = getattr(self._model_service, "current_role_prompt", None)
            if callable(p):
                text = p()
                if text:
                    return text
        return "You are a helpful assistant."

    # ---------- public API ----------

    def get_recent_messages(self) -> List[Dict]:
        """
        Build the system message based on the current role + username,
        then append up to `history_limit` recent messages.
        """
        role_prompt = self._current_role_prompt()

        system_text = (
            f"{role_prompt} "
            "Your name is Maja. "
            f"The user is called {self._model_service.current_user}."
            "Never write more than 50 words."
        )

        # Random twist
        if random.random() < 0.5:
            system_text += " Your response will include some dry or dark humor."
        else:
            system_text += " Your response will include a rather challenging question."

        messages: List[Dict] = [{"role": "system", "content": system_text}]

        history = self._read()
        if self._limit > 0 and history:
            messages.extend(history[-self._limit:])
        return messages

    def store_messages(self, request_data: str, response_data: str) -> None:
        history = self._read()
        history.append({"role": "user", "content": request_data})
        history.append({"role": "assistant", "content": response_data})
        self._atomic_write(history)

    def reset(self) -> None:
        self._atomic_write([])

    # ---------- setters ----------

    def set_model_service(self, model_role_service: ModelRoleService) -> None:
        self._model_service = model_role_service

    def set_history_limit(self, limit: int) -> None:
        self._limit = max(0, limit)

