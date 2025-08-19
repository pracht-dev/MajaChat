from elevenlabs import ElevenLabs, play

from functions.config import ELEVENLABS_API_KEY


class TextToSpeech:
    """

    """

    def __init__(self):
        self.client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

    def convert_to_speech(self, message):
        try:

            audio = self.client.text_to_speech.convert(
                text=message,
                voice_id="98UW4gMjR0J16dSYhLxg",
                model_id="eleven_multilingual_v2",
                output_format="mp3_44100_128",
            )

            return audio
        except Exception as e:
            print(f"[TextToSpeech] Error: {e}")
            return None
