import json
import logging
import httpx
from typing import Optional
from app.engines.video_generator.schema import VideoScript

logger = logging.getLogger(__name__)

class ScriptGeneratorError(Exception):
    pass

class OllamaScriptGenerator:
    """LLM Engine using Ollama to generate VideoScript JSON."""

    def __init__(self, url: str = "http://localhost:11434", model: str = ""):
        self.url = url.rstrip('/')
        self.preset_model = model

    async def _get_model(self) -> str:
        if self.preset_model:
            return self.preset_model
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.url}/api/tags")
                resp.raise_for_status()
                models = [m["name"] for m in resp.json().get("models", [])]
                if not models:
                    raise ScriptGeneratorError("No downloaded models found in Ollama.")
                # Prefer gemma4:e2b (7.1GB fits in 8GB VRAM), then fallback to others
                for pref in ["gemma4:e2b", "gemma4:e4b", "gemma2:2b", "qwen3.5:9b"]:
                    if pref in models:
                        return pref
                chosen = next((m for m in models if "gemma" in m.lower()), None)
                if not chosen:
                    chosen = next((m for m in models if "qwen" in m.lower()), None)
                if not chosen:
                    chosen = next((m for m in models if "llama" in m.lower()), models[0])
                return chosen
        except Exception as e:
            raise ScriptGeneratorError(f"Failed to fetch Ollama models: {e}")

    async def generate(self, content: str, language: str = "Vietnamese", source_url: str = "") -> VideoScript:
        """
        Generates a VideoScript from markdown content using Ollama.
        Uses STREAMING to avoid timeout issues — each token keeps the connection alive.
        Schema matches Auto-Create-Video repo: 6 template types.
        """
        model = await self._get_model()
        
        # Extract domain from URL
        domain = ""
        if source_url:
            from urllib.parse import urlparse
            domain = urlparse(source_url).netloc
        
        prompt = (
            f"You are a professional Vietnamese video scriptwriter for TikTok/Reels 9:16 short videos.\n"
            f"Transform the article below into an engaging script with 5-8 scenes in {language}.\n\n"
            f"RULES:\n"
            f"- First scene MUST be type 'hook' with template 'hook'\n"
            f"- Last scene MUST be type 'outro' with template 'outro'\n"
            f"- Middle scenes are type 'body' — choose from these templates:\n"
            f"  * 'comparison' — for comparing two things (left vs right)\n"
            f"  * 'stat-hero' — for highlighting a big number/statistic\n"
            f"  * 'feature-list' — for listing key points (1-4 bullets)\n"
            f"  * 'callout' — for bold statements or quotes\n"
            f"- Each scene has 'voiceText' (narration in Vietnamese, 2-4 sentences)\n"
            f"- Keep total voiceText around 48-72 seconds when read aloud\n\n"
            f"OUTPUT FORMAT (strict JSON):\n"
            f'{{\n'
            f'  "version": "1.0",\n'
            f'  "metadata": {{\n'
            f'    "title": "Tiêu đề video",\n'
            f'    "source": {{ "url": "{source_url}", "domain": "{domain}", "image": null }},\n'
            f'    "channel": "KNReup News"\n'
            f'  }},\n'
            f'  "voice": {{ "provider": "omnivoice", "voiceId": "vi-VN-HoaiMyNeural", "speed": 1.0 }},\n'
            f'  "scenes": [\n'
            f'    {{\n'
            f'      "id": "s1", "type": "hook",\n'
            f'      "voiceText": "Đoạn mở đầu gây chú ý...",\n'
            f'      "templateData": {{ "template": "hook", "headline": "Tiêu đề ngắn", "subhead": "Phụ đề" }}\n'
            f'    }},\n'
            f'    {{\n'
            f'      "id": "s2", "type": "body",\n'
            f'      "voiceText": "Nội dung chính...",\n'
            f'      "templateData": {{ "template": "stat-hero", "value": "97%", "label": "Mô tả con số" }}\n'
            f'    }},\n'
            f'    {{\n'
            f'      "id": "s3", "type": "body",\n'
            f'      "voiceText": "Mặt khác, đối thủ lại...",\n'
            f'      "templateData": {{\n'
            f'        "template": "comparison",\n'
            f'        "left": {{ "label": "Bên Trái", "value": "Chậm", "color": "cyan" }},\n'
            f'        "right": {{ "label": "Bên Phải", "value": "Nhanh", "color": "purple", "winner": true }}\n'
            f'      }}\n'
            f'    }},\n'
            f'    {{\n'
            f'      "id": "s4", "type": "body",\n'
            f'      "voiceText": "Điều này thật đáng kinh ngạc...",\n'
            f'      "templateData": {{ "template": "callout", "statement": "Nhận định cực kỳ mạnh mẽ!", "tag": "CHÚ Ý" }}\n'
            f'    }},\n'
            f'    {{\n'
            f'      "id": "s5", "type": "body",\n'
            f'      "voiceText": "Và có 3 điểm chính...",\n'
            f'      "templateData": {{ "template": "feature-list", "title": "Điểm chính", "bullets": ["Bullet 1", "Bullet 2"] }}\n'
            f'    }},\n'
            f'    {{\n'
            f'      "id": "sN", "type": "outro",\n'
            f'      "voiceText": "Đoạn kết...",\n'
            f'      "templateData": {{ "template": "outro", "ctaTop": "Follow ngay!", "channelName": "KNReup News", "source": "{domain}" }}\n'
            f'    }}\n'
            f'  ]\n'
            f'}}\n\n'
            f"Output ONLY the raw JSON. No markdown, no explanation.\n\n"
            f"Article Content:\n{content}\n"
        )

        payload = {
            "model": model,
            "prompt": prompt,
            "format": "json",
            "stream": True,  # STREAMING to prevent timeout
            "options": {"temperature": 0.4}
        }

        logger.info(f"Generating video script using Ollama model: {model} (streaming)")

        try:
            # Use streaming to collect tokens — this prevents timeout because
            # each token chunk keeps the HTTP connection alive
            tokens = []
            async with httpx.AsyncClient(timeout=httpx.Timeout(
                connect=10.0,
                read=300.0,    # 300s to allow slow model loading / context evaluation
                write=10.0,
                pool=10.0
            )) as client:
                async with client.stream("POST", f"{self.url}/api/generate", json=payload) as resp:
                    resp.raise_for_status()
                    token_count = 0
                    async for line in resp.aiter_lines():
                        if not line.strip():
                            continue
                        try:
                            data = json.loads(line)
                            tok = data.get("response", "")
                            tokens.append(tok)
                            token_count += 1
                            if token_count % 50 == 0:
                                logger.debug(f"  ... {token_count} tokens generated")
                            if data.get("done"):
                                break
                        except json.JSONDecodeError:
                            continue

            response_text = "".join(tokens).strip()
            logger.info(f"Ollama generated {len(tokens)} tokens, {len(response_text)} chars")
            
            # Sometime LLMs still output markdown blocks like ```json ... ```
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            parsed_json = json.loads(response_text)
            
            # Unload the model to free VRAM for TTS
            logger.info("Unloading Ollama model to free VRAM...")
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    await client.post(f"{self.url}/api/generate", json={
                        "model": model,
                        "keep_alive": 0
                    })
                logger.info("Ollama model unloaded successfully.")
            except Exception as unload_e:
                logger.warning(f"Failed to unload Ollama model: {unload_e}")
                
            # Auto-correction for common LLM JSON shape hallucinations
            if "metadata" not in parsed_json:
                logger.warning("LLM omitted 'metadata' wrapper. Auto-correcting...")
                corrected = {
                    "version": parsed_json.get("version", "1.0"),
                    "metadata": {
                        "title": parsed_json.get("title", "Bản tin KNReup"),
                        "source": parsed_json.get("source", {"url": source_url if hasattr(self, 'source_url') else "", "domain": "knreup.com"}),
                        "channel": parsed_json.get("channel", "KNReup News")
                    },
                    "voice": parsed_json.get("voice", { "provider": "omnivoice", "voiceId": "vi-VN-HoaiMyNeural", "speed": 1.0 }),
                    "scenes": parsed_json.get("scenes", [])
                }
                
                # If LLM put scenes as top-level keys like scene_1, scene_2
                if not corrected["scenes"]:
                    extracted_scenes = []
                    for k, v in parsed_json.items():
                        if isinstance(v, dict) and "type" in v and "voiceText" in v:
                            extracted_scenes.append(v)
                    if extracted_scenes:
                        corrected["scenes"] = extracted_scenes
                        
                parsed_json = corrected

            script_obj = VideoScript(**parsed_json)
            if not script_obj.scenes:
                raise ScriptGeneratorError("LLM failed to generate any scenes.")
            return script_obj
        except json.JSONDecodeError as e:
            logger.error(f"LLM output is not valid JSON: {response_text[:500]}")
            raise ScriptGeneratorError(f"Ollama returned invalid JSON: {e}")
        except Exception as e:
            logger.exception("Failed to generate or parse VideoScript")
            raise ScriptGeneratorError(f"Ollama script generation failed: {e}")

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.url}/api/tags")
                return resp.status_code == 200
        except:
            return False
