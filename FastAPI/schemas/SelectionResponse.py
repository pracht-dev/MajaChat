# schemas/selection.py
from typing import Dict

from pydantic import BaseModel


class CurrentSelection(BaseModel):
    username: str
    model: Dict[str, str]
    role: Dict[str, str]

class SelectionResponse(BaseModel):
    message: str
    current: CurrentSelection