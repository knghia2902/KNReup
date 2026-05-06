"""2-pass script sanitizer for LLM output.

Pass 1: sanitize_script() — lenient fixer for common LLM hallucinations
Pass 2: Pydantic strict validation via VideoScript.model_validate()
"""
import logging
from typing import Optional
from app.engines.video_generator.schema import VideoScript

logger = logging.getLogger(__name__)

# Valid scene types
VALID_SCENE_TYPES = {"hook", "body", "outro"}

# Valid template names for body scenes
VALID_BODY_TEMPLATES = {
    "comparison", "stat-hero", "feature-list", "callout",
    "quote", "timeline", "countdown", "split-image",
    "data-grid", "title-card",
}

ALL_TEMPLATES = VALID_BODY_TEMPLATES | {"hook", "outro"}


def _ensure_wrapper(raw: dict, source_url: str = "") -> dict:
    """Ensure top-level structure: version, metadata, voice, scenes."""
    if "metadata" not in raw:
        logger.warning("LLM omitted 'metadata' wrapper. Auto-correcting...")
        from urllib.parse import urlparse
        domain = urlparse(source_url).netloc if source_url else "knreup.com"
        return {
            "version": raw.get("version", "1.0"),
            "metadata": {
                "title": raw.get("title", "Bản tin KNReup"),
                "source": raw.get("source", {"url": source_url, "domain": domain}),
                "channel": raw.get("channel", "KNReup News"),
            },
            "voice": raw.get("voice", {
                "provider": "omnivoice",
                "voiceId": "vi-VN-HoaiMyNeural",
                "speed": 1.0,
            }),
            "scenes": raw.get("scenes", []),
        }
    return raw.copy()


def _extract_orphan_scenes(raw: dict, corrected: dict) -> None:
    """If LLM put scenes as top-level keys like scene_1, scene_2."""
    if corrected.get("scenes"):
        return
    extracted = []
    for k, v in raw.items():
        if isinstance(v, dict) and "type" in v and "voiceText" in v:
            extracted.append(v)
    if extracted:
        corrected["scenes"] = extracted


def _fix_scene_types(scenes: list) -> None:
    """Auto-correct hallucinated scene types → 'body'."""
    for s in scenes:
        scene_type = s.get("type", "body")
        if scene_type not in VALID_SCENE_TYPES:
            if scene_type in VALID_BODY_TEMPLATES:
                td = s.setdefault("templateData", {})
                td.setdefault("template", scene_type)
            s["type"] = "body"


def _flatten_nested_template_data(scenes: list) -> None:
    """Flatten nested templateData like {"template": "timeline", "timeline": {"title": ...}}."""
    for s in scenes:
        td = s.get("templateData", {})
        if not isinstance(td, dict):
            continue

        tmpl_name = td.get("template")

        # Infer template name if missing
        if not tmpl_name:
            for k in td.keys():
                if k in ALL_TEMPLATES and isinstance(td[k], dict):
                    tmpl_name = k
                    td["template"] = k
                    break

        # Flatten nested dict
        if tmpl_name and tmpl_name in td and isinstance(td[tmpl_name], dict):
            nested_data = td.pop(tmpl_name)
            for k, v in nested_data.items():
                if k not in td:
                    td[k] = v


def _heal_template_fields(scenes: list) -> None:
    """Fill missing required fields per template type."""
    for s in scenes:
        td = s.get("templateData", {})
        if not isinstance(td, dict):
            continue

        t = td.get("template")
        if t == "quote":
            if "statement" in td and "text" not in td:
                td["text"] = td.pop("statement")
            td.setdefault("text", "Đang cập nhật...")
            td.setdefault("author", "Nguồn tin")
        elif t == "callout":
            if "text" in td and "statement" not in td:
                td["statement"] = td.pop("text")
            td.setdefault("statement", "Thông tin quan trọng")
        elif t == "timeline":
            td.setdefault("title", "Dòng sự kiện")
            evts = td.get("events")
            if not isinstance(evts, list) or len(evts) < 2:
                td["events"] = [
                    {"year": "Nay", "event": "Sự kiện 1"},
                    {"year": "Tới", "event": "Sự kiện 2"},
                ]
        elif t == "feature-list":
            td.setdefault("title", "Danh sách")
            bullets = td.get("bullets")
            if not isinstance(bullets, list) or len(bullets) == 0:
                td["bullets"] = ["Điểm nổi bật"]
        elif t == "stat-hero":
            td.setdefault("value", "100%")
            td.setdefault("label", "Thống kê")
        elif t == "comparison":
            td.setdefault("left", {"label": "A", "value": "N/A", "color": "cyan"})
            td.setdefault("right", {"label": "B", "value": "N/A", "color": "purple"})
        elif t == "countdown":
            td.setdefault("label", "Đếm ngược")
            td.setdefault("number", "3")
            td.setdefault("unit", "ngày")
        elif t == "split-image":
            td.setdefault("headline", "Tin nóng")
            td.setdefault("body", "Đang cập nhật chi tiết...")
        elif t == "data-grid":
            td.setdefault("title", "Bảng dữ liệu")
            cells = td.get("cells")
            if not isinstance(cells, list) or len(cells) < 4:
                td["cells"] = [
                    {"value": "1", "label": "Mục 1"},
                    {"value": "2", "label": "Mục 2"},
                    {"value": "3", "label": "Mục 3"},
                    {"value": "4", "label": "Mục 4"},
                ]
        elif t == "title-card":
            td.setdefault("category", "Tin tức")
            td.setdefault("title", "Tiêu đề")
            td.setdefault("date", "Hôm nay")
        elif t == "hook":
            td.setdefault("headline", "Tin nóng")
            td.setdefault("subhead", "")
        elif t == "outro":
            td.setdefault("ctaTop", "Follow ngay!")
            td.setdefault("channelName", "KNReup News")
            td.setdefault("source", "knreup.com")


def sanitize_script(raw: dict, source_url: str = "") -> dict:
    """Pass 1: Lenient sanitizer — fixes common LLM hallucinations.
    
    Returns cleaned dict ready for Pydantic strict validation.
    """
    if not isinstance(raw, dict):
        return {"version": "1.0", "metadata": {}, "voice": {}, "scenes": []}

    corrected = _ensure_wrapper(raw, source_url)
    _extract_orphan_scenes(raw, corrected)

    scenes = corrected.get("scenes", [])
    _fix_scene_types(scenes)
    _flatten_nested_template_data(scenes)
    _heal_template_fields(scenes)

    return corrected


def validate_script(raw: dict, source_url: str = "") -> VideoScript:
    """2-pass validation: sanitize → Pydantic strict.
    
    Usage:
        script = validate_script(parsed_json, source_url=url)
    """
    cleaned = sanitize_script(raw, source_url)
    return VideoScript.model_validate(cleaned)
