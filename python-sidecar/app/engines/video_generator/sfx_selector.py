"""Smart SFX selector — port 1:1 từ KNCraw sfx-selector.ts.

3-tier strategy:
  Tier 1: Explicit override (scene.sfx) — handled at pipeline level
  Tier 2: Semantic keyword match (voiceText regex)
  Tier 3: Template default category mapping
  Tier 4: Last-resort fallback (any non-empty category)
"""
import os
import re
import logging
from dataclasses import dataclass
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

SfxIndex = Dict[str, List[str]]  # category → sorted list of mp3 filenames


def index_sfx_library(sfx_dir: str) -> SfxIndex:
    """Walk sfx_dir/<category>/*.mp3 and build index. Empty dict if dir missing."""
    index: SfxIndex = {}
    if not os.path.exists(sfx_dir):
        return index
    for cat in sorted(os.listdir(sfx_dir)):
        cat_dir = os.path.join(sfx_dir, cat)
        if not os.path.isdir(cat_dir):
            continue
        files = sorted(f for f in os.listdir(cat_dir) if f.lower().endswith(".mp3"))
        if files:
            index[cat] = files
    return index


def _hash_code(s: str) -> int:
    """Stable hash — port 1:1 từ TypeScript hashCode. Deterministic."""
    h = 0
    for ch in s:
        h = ((h << 5) - h) + ord(ch)
        h &= 0xFFFFFFFF
    if h >= 0x80000000:
        h -= 0x100000000
    return abs(h)


def _pick_from_category(category: str, scene_id: str, index: SfxIndex) -> Optional[str]:
    pool = index.get(category)
    if not pool:
        return None
    idx = _hash_code(scene_id) % len(pool)
    return pool[idx]


# 12 template types with default SFX categories
TEMPLATE_TO_CATEGORY: Dict[str, List[str]] = {
    "hook":         ["transition", "cinematic"],
    "comparison":   ["transition", "emphasis"],
    "stat-hero":    ["emphasis", "success"],
    "feature-list": ["transition", "emphasis"],
    "callout":      ["alert", "drumroll"],
    "outro":        ["outro", "success"],
    "quote":        ["emphasis", "cinematic"],
    "timeline":     ["transition", "emphasis"],
    "countdown":    ["countdown", "drumroll"],
    "split-image":  ["reveal", "transition"],
    "data-grid":    ["emphasis", "success"],
    "title-card":   ["transition", "cinematic"],
}


@dataclass
class KeywordRule:
    pattern: re.Pattern
    category: str
    label: str


KEYWORD_RULES: List[KeywordRule] = [
    KeywordRule(re.compile(r"(cảnh báo|rủi ro|nguy hiểm|đáng lo|đe dọa|cảnh giác|tiêu cực|lo ngại|warning|danger|alert|risk|threat)", re.IGNORECASE), "alert", "warning"),
    KeywordRule(re.compile(r"(thất bại|sai lầm|sụp đổ|lỗi nghiêm trọng|không đạt|trượt|fail|error|wrong|mistake|crash|broken)", re.IGNORECASE), "fail", "failure"),
    KeywordRule(re.compile(r"(kỷ lục|kỉ lục|vượt xa|xuất sắc|đạt mốc|thành công|tăng mạnh|đột phá|hàng đầu|breakthrough|achievement|success|record|win|outperform)", re.IGNORECASE), "success", "success"),
    KeywordRule(re.compile(r"(tiết lộ|khám phá|lần đầu|công bố|ra mắt|trình làng|hé lộ|phát hành|reveal|launch|unveil|debut|announce|introduce)", re.IGNORECASE), "reveal", "reveal"),
    KeywordRule(re.compile(r"(đếm ngược|tích tắc|đồng hồ|thời hạn|deadline|countdown|tick|hurry)", re.IGNORECASE), "countdown", "countdown"),
    KeywordRule(re.compile(r"(hùng vĩ|hoành tráng|vĩ đại|chấn động|khổng lồ|cinematic|epic|massive|huge|colossal)", re.IGNORECASE), "cinematic", "cinematic"),
    KeywordRule(re.compile(r"(hồi hộp|chờ đợi|sắp tới|và đây|và bây giờ|drumroll|suspense|anticipation)", re.IGNORECASE), "drumroll", "drumroll"),
]


@dataclass
class PickedSfx:
    rel_path: str  # e.g. "transition/whoosh-soft.mp3"
    source: str    # "override" | "semantic" | "template" | "fallback"
    matched_keyword: Optional[str] = None


def pick_sfx_for_scene(
    voice_text: str,
    template_name: str,
    scene_id: str,
    index: SfxIndex,
) -> Optional[PickedSfx]:
    """Main selector. Tier 1 (explicit override) handled at pipeline level."""

    # Tier 2: semantic keyword match
    for rule in KEYWORD_RULES:
        m = rule.pattern.search(voice_text)
        if m:
            filename = _pick_from_category(rule.category, scene_id, index)
            if filename:
                return PickedSfx(
                    rel_path=f"{rule.category}/{filename}",
                    source="semantic",
                    matched_keyword=m.group(0),
                )

    # Tier 3: template default
    candidates = TEMPLATE_TO_CATEGORY.get(template_name, [])
    for cat in candidates:
        filename = _pick_from_category(cat, scene_id, index)
        if filename:
            return PickedSfx(rel_path=f"{cat}/{filename}", source="template")

    # Tier 4: last-resort fallback
    for cat in sorted(index.keys()):
        filename = _pick_from_category(cat, scene_id, index)
        if filename:
            return PickedSfx(rel_path=f"{cat}/{filename}", source="fallback")

    return None


# Volume + offset defaults per category
DEFAULT_PLAYBACK: Dict[str, Dict[str, float]] = {
    "transition": {"volume": 0.40, "offset_sec": 0.0},
    "emphasis":   {"volume": 0.35, "offset_sec": 0.2},
    "alert":      {"volume": 0.40, "offset_sec": 0.1},
    "success":    {"volume": 0.35, "offset_sec": 0.3},
    "fail":       {"volume": 0.35, "offset_sec": 0.1},
    "reveal":     {"volume": 0.30, "offset_sec": 0.2},
    "countdown":  {"volume": 0.30, "offset_sec": 0.0},
    "cinematic":  {"volume": 0.35, "offset_sec": 0.0},
    "drumroll":   {"volume": 0.40, "offset_sec": 0.0},
    "outro":      {"volume": 0.35, "offset_sec": 0.5},
}


def get_default_playback(picked: PickedSfx) -> Dict[str, float]:
    cat = picked.rel_path.split("/")[0]
    return DEFAULT_PLAYBACK.get(cat, {"volume": 0.35, "offset_sec": 0.1})
