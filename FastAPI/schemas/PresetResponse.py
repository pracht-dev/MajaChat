# schemas/presets.py
from typing import List, Dict

from pydantic import BaseModel


class PresetsResponse(BaseModel):
    models: List[Dict[str, str]]
    roles: List[Dict[str, str]]