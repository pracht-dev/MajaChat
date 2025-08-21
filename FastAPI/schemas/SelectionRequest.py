from typing import Optional

from pydantic import BaseModel


class SelectionRequest(BaseModel):
    username: Optional[str] = None
    model_id: Optional[str] = None
    role_id: Optional[str] = None
    api_key: Optional[str] = None  # nur bei Cloud