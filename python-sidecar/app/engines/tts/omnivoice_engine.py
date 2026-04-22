"""OmniVoice TTS Engine."""
import logging
import os
import shutil
from pathlib import Path
import json

from app.engines.base import TTSEngine, TTSError
from app.utils.gpu_detect import detect_gpu

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent.parent.parent.parent / "data" / "tts_profiles"

class OmniVoiceTTSEngine(TTSEngine):
    """Offline TTS using OmniVoice."""
    
    engine_name = "omnivoice"
    is_online = False

    def __init__(self):
        self.profiles_dir = MODELS_DIR
        self.profiles_dir.mkdir(parents=True, exist_ok=True)
        self._model = None
        # We don't load the model immediately to save memory until requested,
        # but we initialize the structure.

    def _load_model(self):
        if self._model is not None:
            return
            
        try:
            from omnivoice import OmniVoice
            
            # Select device based on GPU availability
            gpu_info = detect_gpu()
            self._device = "cuda" if gpu_info.get("gpu_available", False) else "cpu"
            
            logger.info(f"Loading OmniVoice model on {self._device}...")
            
            # Using hypothetical generic constructor/loader
            # For standard models, this might just be a basic initialization
            # Adjust if omnivoice has a specific from_pretrained method
            if hasattr(OmniVoice, "from_pretrained"):
                self._model = OmniVoice.from_pretrained("omnivoice")
            else:
                self._model = OmniVoice()
                
            if hasattr(self._model, "to"):
                self._model.to(self._device)
                
            logger.info("OmniVoice model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load OmniVoice model: {e}")

    async def synthesize(
        self,
        text: str,
        voice: str = "default",
        output_path: str = "output.wav",
        rate: float = 1.0,
        volume: float = 1.0,
        pitch: float = 0.5,
    ) -> str:
        """Synthesize audio using OmniVoice."""
        self._load_model()
        if not self._model:
            raise TTSError("OmniVoice model could not be loaded")
            
        try:
            import soundfile as sf
            
            ref_audio = None
            if voice and voice != "default":
                profile_path = self.profiles_dir / f"{voice}.json"
                if profile_path.exists():
                    with open(profile_path, "r") as f:
                        profile_data = json.load(f)
                    ref_audio = profile_data.get("audio_path")

            # Map the rate parameter to speed
            speed = rate if rate > 0 else 1.0
            
            audio_data = self._model.generate(
                text=text,
                ref_audio=ref_audio,
                speed=speed
            )
            
            # Assuming output is a list of numpy arrays
            if isinstance(audio_data, list) and len(audio_data) > 0:
                audio_array = audio_data[0]
            else:
                audio_array = audio_data
                
            # Default SR for OmniVoice, usually 24k or 16k
            sf.write(output_path, audio_array, 24000) 
            
            return output_path
        except Exception as e:
            raise TTSError(f"OmniVoice synthesis failed: {e}")

    async def list_voices(self) -> list[dict]:
        """List default and cloned voices."""
        voices = [{"name": "default", "id": "default", "type": "system", "locale": "multilingual"}]
        if self.profiles_dir.exists():
            for p in self.profiles_dir.glob("*.json"):
                voices.append({
                    "name": p.stem,
                    "id": p.stem,
                    "type": "cloned",
                    "locale": "multilingual"
                })
        return voices

    async def health_check(self) -> bool:
        """Check if engine is available."""
        try:
            import omnivoice
            return True
        except ImportError:
            return False

    def preprocess_reference_audio(self, input_path: str, output_path: str) -> str:
        """Preprocess audio for voice cloning (e.g., resample, normalize)."""
        try:
            import librosa
            import soundfile as sf
            
            # Load and resample to 24kHz (common for TTS)
            y, sr = librosa.load(input_path, sr=24000)
            
            # Optionally normalize volume here
            
            sf.write(output_path, y, sr)
            return output_path
        except Exception as e:
            raise TTSError(f"Audio preprocessing failed: {e}")

    def create_voice_profile(self, audio_path: str, profile_name: str) -> str:
        """Save a preprocessed voice profile."""
        if not self.profiles_dir.exists():
            self.profiles_dir.mkdir(parents=True, exist_ok=True)
            
        dest_audio = self.profiles_dir / f"{profile_name}.wav"
        shutil.copy(audio_path, dest_audio)
        
        profile_path = self.profiles_dir / f"{profile_name}.json"
        with open(profile_path, "w") as f:
            json.dump({
                "name": profile_name,
                "audio_path": str(dest_audio)
            }, f, indent=2)
            
        return str(profile_path)
