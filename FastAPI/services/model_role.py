from typing import List, Dict, Optional

from schemas.PresetResponse import PresetsResponse
from schemas.SelectionRequest import SelectionRequest
from schemas.SelectionResponse import SelectionResponse, CurrentSelection


class ModelRoleService:
    """
    Minimal service:
    - provide list of roles and models with default values
    - validate user's choice
    """

    def __init__(self):
        # Rollen zur Auswahl
        self._roles: List[Dict] = [
            {"id": "friendly_guide", "label": "Friendly Guide",
             "prompt": "Be warm, kind, and concise."},

            {"id": "expert_dev", "label": "Expert Developer",
             "prompt": "Answer as a precise software engineer. Give clear, technical replies."},

            {"id": "language_coach", "label": "Language Coach",
             "prompt": "Teach languages with short, clear examples."},

            {"id": "career_coach", "label": "Career Coach",
             "prompt": "Give resume and interview advice. Stay practical and concise."},

            {"id": "dating_coach", "label": "Dating Coach",
             "prompt": "Give respectful dating advice. Be supportive and practical."},

            {"id": "lover", "label": "Lover",
             "prompt": "Speak with affection and romance."},

            {"id": "dirty_talk", "label": "Dirty Talk",
             "prompt": "Respond with sexy, playful dirty talk."},

            {"id": "poet", "label": "Poet",
             "prompt": "Answer in short poetic lines, full of imagery."},

            {"id": "historian", "label": "Historian",
             "prompt": "Explain history in concise facts, like a chronicle."},

            {"id": "nobleman", "label": "Adeliger",
             "prompt": "Sprich wie ein höfischer Edelmann des Mittelalters auf Deutsch."},

            {"id": "motivator", "label": "Motivator",
             "prompt": "Give strong, uplifting encouragement."},

            {"id": "philosopher", "label": "Philosopher",
             "prompt": "Reflect deeply yet briefly. Share thoughtful insights."},

            {"id": "haitian_storyteller", "label": "Haitian Storyteller",
             "prompt": "Tell short Haitian stories and historical facts with pride. Always put some Haitian creole in your answers or speak only creole"}
        ]
        # Modelle zur Auswahl
        self._models: List[Dict] = [
            {"id": "local", "label": "Local (offline)",
             "description": "Runs with local AI model, no API key required."},

            {"id": "openai", "label": "OpenAI",
             "description": "Requires OPENAI_API_KEY. Uses GPT-based models."},

            {"id": "gemini", "label": "Gemini",
             "description": "Requires GEMINI_API_KEY. Uses Google Gemini models."},

            # {"id": "anthropic", "label": "Anthropic (cloud)",
            #  "description": "Requires ANTHROPIC_API_KEY. Placeholder for Claude models."},
            #
            # {"id": "custom", "label": "Custom API (cloud)",
            #  "description": "Placeholder for additional providers or your own API."}
        ]

        # Default selection
        self._current_model: Dict = self._models[0]
        self._current_role: Dict = self._roles[0]
        self.current_user: str = "Glory"

        # Optional 
        self._api_key: Optional[str] = None

    def list_roles(self) -> List[Dict]:
        return self._roles

    def list_models(self) -> List[Dict]:
        return self._models

    def get_presets(self) -> PresetsResponse:
        """
        Return both models and roles in one call
        :return:
        """
        return PresetsResponse(models=self._models, roles=self._roles)

    def get_role_prompt(self, role_value: str) -> str:
        for r in self._roles:
            if r["id"] == role_value:
                return r["prompt"]
        return next(r["prompt"] for r in self._roles if r["id"] == self.default_role)

    # --- Validierung / Defaults ---
    def validate_selection(self, model: str, role: str) -> None:
        if not any(m["id"] == model for m in self._models):
            raise ValueError("Invalid model")
        if not any(r["id"] == role for r in self._roles):
            raise ValueError("Invalid role")

    def defaults(self) -> Dict[str, str]:
        return {"model": self.default_model, "role": self.default_role}

    def set_selection(self, selection: SelectionRequest) -> Dict:
        """Set the chosen model and role, fallback to defaults if not found or not provided."""
        if selection.model_id:
            found_model = next((m for m in self._models if m["id"] == selection.model_id), None)
            if found_model:
                self._current_model = found_model

        if selection.role_id:
            found_role = next((r for r in self._roles if r["id"] == selection.role_id), None)
            if found_role:
                self._current_role = found_role

        if selection.username:
            self.current_user = selection.username
        # Falls Cloud → API Key speichern
        if selection.api_key and self._current_model["id"] != "local":
            self._api_key = selection.api_key
        else:
            self._api_key = None


        return SelectionResponse(
            message="Selection updated successfully",
            current=CurrentSelection(
                username=self.current_user,
                model=self._current_model,
                role=self._current_role
            )
        )

    # ---- used by message helper ----
    def current_role(self) -> Dict:
        return self._current_role

    def current_role_prompt(self) -> str:
        return self._current_role.get("prompt", "")
