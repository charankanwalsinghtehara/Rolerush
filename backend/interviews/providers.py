"""Voice provider boundary.

The app does not hard-code a vendor. The browser can handle STT/TTS locally,
while a server provider can be plugged in later without changing interview logic.
"""

class SpeechToTextProvider:
    name = "base"

    def transcribe(self, audio_file):
        raise NotImplementedError


class TextToSpeechProvider:
    name = "base"

    def synthesize(self, text):
        raise NotImplementedError


class BrowserVoiceProvider:
    """Marker provider for browser-native SpeechRecognition/SpeechSynthesis."""
    name = "browser"
