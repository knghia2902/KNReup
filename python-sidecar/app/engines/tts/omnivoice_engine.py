"""OmniVoice TTS Engine."""
import logging
import os
import shutil
from pathlib import Path
import json
from datetime import datetime

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
            import torch
            
            # Select device based on GPU availability
            gpu_info = detect_gpu()
            self._device = "cuda" if gpu_info.get("gpu_available", False) else "cpu"
            
            logger.info(f"Loading OmniVoice model on {self._device}...")
            
            # Use specific fine-tuned vietnamese model
            repo_id = "splendor1811/omnivoice-vietnamese"
            
            if hasattr(OmniVoice, "from_pretrained"):
                self._model = OmniVoice.from_pretrained(repo_id, device_map=self._device)
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
            import torch
            import numpy as np
            
            ref_audio = None
            if voice and voice != "default":
                profile_path = self.profiles_dir / f"{voice}.json"
                if profile_path.exists():
                    try:
                        with open(profile_path, "r") as f:
                            profile_data = json.load(f)
                        ref_audio = profile_data.get("audio_path")
                    except Exception as e:
                        logger.error(f"Error reading profile {voice}: {e}")

            # Map the rate parameter to speed
            speed = rate if rate > 0 else 1.0
            
            kwargs = {
                "text": text,
                "language": "vi",
                "speed": speed,
                "guidance_scale": 2.5,
                "num_step": 8
            }
            if ref_audio:
                kwargs["ref_audio"] = ref_audio
            else:
                kwargs["instruct"] = "female"
            
            results = self._model.generate(**kwargs)
            
            if not results or len(results) == 0:
                raise RuntimeError("OmniVoice failed to generate any audio.")
                
            audio_data = results[0]
            
            if hasattr(audio_data, "flatten"):
                audio_array = audio_data.flatten()
            else:
                audio_array = audio_data
                
            if isinstance(audio_array, torch.Tensor):
                audio_array = audio_array.detach().cpu().numpy()
                
            # Default SR for OmniVoice, usually 24k or 16k
            sf.write(output_path, audio_array, 24000) 
            
            # Optional memory cleanup
            torch.cuda.empty_cache()
            
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

    def voice_design(self, description: str, text: str, output_path: str = "design_output.wav", region: str = "Bắc", speed: float = 1.0) -> str:
        """Generate voice from text description and region using OmniVoice."""
        self._load_model()
        if not self._model:
            raise TTSError("OmniVoice model could not be loaded")
        
        import soundfile as sf
        audio_data = self._model.generate(
            text=text,
            voice_description=description,
            region=region,
            speed=speed
        )
        if isinstance(audio_data, list) and len(audio_data) > 0:
            audio_array = audio_data[0]
        else:
            audio_array = audio_data
        sf.write(output_path, audio_array, 24000)
        return output_path

    async def preview_voice(self, profile_name: str, text: str, output_path: str = "preview.wav") -> str:
        """Preview a cloned voice with custom text."""
        return await self.synthesize(text=text, voice=profile_name, output_path=output_path)

    def get_profile_details(self, profile_name: str) -> dict:
        """Get full profile metadata including creation date and audio duration."""
        profile_path = self.profiles_dir / f"{profile_name}.json"
        if not profile_path.exists():
            return None
        with open(profile_path, "r") as f:
            data = json.load(f)
        audio_path = data.get("audio_path", "")
        duration = 0
        if audio_path and os.path.exists(audio_path):
            import librosa
            duration = round(librosa.get_duration(path=audio_path), 1)
        data["duration"] = duration
        data["created_at"] = os.path.getctime(str(profile_path))
        return data

    def create_voice_profile(self, audio_path, profile_name, profile_type="cloned"):
        dest_audio = self.profiles_dir / f"{profile_name}.wav"
        if str(audio_path) != str(dest_audio):
            shutil.copy2(audio_path, dest_audio)
            
        profile_path = self.profiles_dir / f"{profile_name}.json"
        with open(profile_path, "w") as f:
            json.dump({
                "name": profile_name,
                "audio_path": str(dest_audio),
                "type": profile_type,
                "created_at": datetime.now().isoformat(),
            }, f, indent=2)
        return str(profile_path)
        
    def preprocess_reference_audio(self, input_path: str, output_path: str):
        if str(input_path) != str(output_path):
            shutil.copy2(input_path, output_path)

    def delete_profile(self, profile_name: str) -> bool:
        profile_path = self.profiles_dir / f"{profile_name}.json"
        audio_path = self.profiles_dir / f"{profile_name}.wav"
        if profile_path.exists():
            profile_path.unlink()
        if audio_path.exists():
            audio_path.unlink()
        return True

    def get_audio_duration(self, audio_path: str) -> float:
        import librosa
        return round(librosa.get_duration(path=audio_path), 1)

    def save_to_history(self, text: str, profile_name: str, audio_path: str) -> dict:
        import librosa
        import uuid
        history_dir = self.profiles_dir.parent / "history"
        history_dir.mkdir(parents=True, exist_ok=True)
        record = {
            "id": str(uuid.uuid4()),
            "text": text,
            "profile_name": profile_name,
            "audio_path": Path(audio_path).name,
            "duration": round(librosa.get_duration(path=audio_path), 1),
            "created_at": datetime.now().isoformat()
        }
        
        audio_dest = history_dir / Path(audio_path).name
        if Path(audio_path) != audio_dest:
            shutil.copy2(audio_path, audio_dest)
            
        history_file = history_dir / "tts_history.json"
        history = []
        if history_file.exists():
            with open(history_file, "r", encoding="utf-8") as f:
                history = json.load(f)
        history.insert(0, record)
        with open(history_file, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2, ensure_ascii=False)
        return record

    def get_history(self) -> list:
        history_file = self.profiles_dir.parent / "history" / "tts_history.json"
        if history_file.exists():
            with open(history_file, "r", encoding="utf-8") as f:
                return json.load(f)
        return []


