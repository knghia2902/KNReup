from enum import Enum
from typing import List, Optional, Any, Union, Literal, Annotated
from pydantic import BaseModel, Field

# ── Template data shapes (discriminated by template field) ───────────────
# Aligning exactly with Auto-Create-Video's 6 implemented templates

# ─── 1. HOOK ─────────────────────────────────────────────────────────────
class HookTemplateData(BaseModel):
    template: Literal["hook"] = "hook"
    headline: str = Field(..., max_length=100, description="Tiêu đề ngắn gọn gây chú ý")
    subhead: Optional[str] = Field(None, max_length=150, description="Phụ đề bên dưới headline")
    bgSrc: Optional[str] = Field(None, description="Đường dẫn ảnh nền ($source.image → thay thế tự động)")
    kenBurns: Optional[str] = Field("zoom-in", description="Hiệu ứng Ken Burns: zoom-in, zoom-out, pan-left, pan-right")

# ─── 2. COMPARISON ───────────────────────────────────────────────────────
class ComparisonSide(BaseModel):
    label: str = Field(..., max_length=60)
    value: str = Field(..., max_length=60)
    color: str = Field("cyan", description="cyan hoặc purple")

class ComparisonSideRight(ComparisonSide):
    winner: Optional[bool] = None

class ComparisonTemplateData(BaseModel):
    template: Literal["comparison"] = "comparison"
    left: ComparisonSide
    right: ComparisonSideRight

# ─── 3. STAT HERO ────────────────────────────────────────────────────────
class StatHeroTemplateData(BaseModel):
    template: Literal["stat-hero"] = "stat-hero"
    value: str = Field(..., max_length=40, description="Con số chính (VD: '97%', '$2.1B')")
    label: str = Field(..., max_length=80, description="Nhãn mô tả con số")
    context: Optional[str] = Field(None, max_length=100, description="Ngữ cảnh bổ sung")

# ─── 4. FEATURE LIST ─────────────────────────────────────────────────────
class FeatureListData(BaseModel):
    template: Literal["feature-list"] = "feature-list"
    title: str = Field(..., max_length=80, description="Tiêu đề danh sách")
    bullets: List[str] = Field(..., min_length=1, max_length=5, description="Danh sách 1-5 bullet points")
    icon: Optional[str] = Field(None, description="Icon tùy chọn")

# ─── 5. CALLOUT ──────────────────────────────────────────────────────────
class CalloutTemplateData(BaseModel):
    template: Literal["callout"] = "callout"
    statement: str = Field(..., max_length=200, description="Câu nhận định mạnh")
    tag: Optional[str] = Field(None, max_length=40, description="Tag nhỏ (VD: 'CẢNH BÁO', 'QUAN TRỌNG')")

# ─── 6. OUTRO ────────────────────────────────────────────────────────────
class OutroTemplateData(BaseModel):
    template: Literal["outro"] = "outro"
    ctaTop: str = Field(..., max_length=60, description="Call to action text")
    channelName: str = Field(..., max_length=60, description="Tên kênh")
    source: str = Field(..., max_length=80, description="Nguồn bài viết")

# ─── 7. QUOTE ────────────────────────────────────────────────────────────
class QuoteTemplateData(BaseModel):
    template: Literal["quote"] = "quote"
    text: str = Field(..., max_length=200, description="Trích dẫn")
    author: str = Field(..., max_length=80, description="Tác giả")

# ─── 8. TIMELINE ─────────────────────────────────────────────────────────
class TimelineEvent(BaseModel):
    year: str = Field(..., max_length=20)
    event: str = Field(..., max_length=80)

class TimelineTemplateData(BaseModel):
    template: Literal["timeline"] = "timeline"
    title: str = Field(..., max_length=80)
    events: List[TimelineEvent] = Field(..., min_length=2, max_length=4)

# ─── 9. COUNTDOWN ────────────────────────────────────────────────────────
class CountdownTemplateData(BaseModel):
    template: Literal["countdown"] = "countdown"
    label: str = Field(..., max_length=80)
    number: str = Field(..., max_length=10)
    unit: str = Field(..., max_length=20)

# ─── 10. SPLIT IMAGE ─────────────────────────────────────────────────────
class SplitImageTemplateData(BaseModel):
    template: Literal["split-image"] = "split-image"
    headline: str = Field(..., max_length=80)
    body: str = Field(..., max_length=150)
    imgSrc: Optional[str] = Field(None, description="Đường dẫn ảnh")

# ─── 11. DATA GRID ───────────────────────────────────────────────────────
class DataGridCell(BaseModel):
    value: str = Field(..., max_length=20)
    label: str = Field(..., max_length=40)

class DataGridTemplateData(BaseModel):
    template: Literal["data-grid"] = "data-grid"
    title: str = Field(..., max_length=80)
    cells: List[DataGridCell] = Field(..., min_length=4, max_length=4)

# ─── 12. TITLE CARD ──────────────────────────────────────────────────────
class TitleCardTemplateData(BaseModel):
    template: Literal["title-card"] = "title-card"
    category: str = Field(..., max_length=40)
    title: str = Field(..., max_length=100)
    date: str = Field(..., max_length=40)

# ── Scene type enum ─────────────────────────────────────────────────────
class SceneType(str, Enum):
    HOOK = "hook"
    BODY = "body"
    OUTRO = "outro"

# ── SFX Spec ────────────────────────────────────────────────────────────
class SfxSpec(BaseModel):
    name: str = Field(..., description="SFX name (e.g. 'transition/whoosh-soft') or 'none' to disable")
    volume: float = Field(0.4, ge=0, le=1)
    startOffsetSec: float = Field(0.0)

TemplateUnion = Annotated[
    Union[
        HookTemplateData,
        ComparisonTemplateData,
        StatHeroTemplateData,
        FeatureListData,
        CalloutTemplateData,
        OutroTemplateData,
        QuoteTemplateData,
        TimelineTemplateData,
        CountdownTemplateData,
        SplitImageTemplateData,
        DataGridTemplateData,
        TitleCardTemplateData,
    ],
    Field(discriminator="template")
]

# ── Scene schema ────────────────────────────────────────────────────────
class Scene(BaseModel):
    id: str = Field(..., description="ID duy nhất của scene (VD: 's1', 's2')")
    type: SceneType = Field(..., description="Loại scene: hook, body, hoặc outro")
    voiceText: str = Field(..., description="Đoạn thoại sẽ được đọc bởi TTS engine")
    templateData: TemplateUnion = Field(..., description="Dữ liệu template — 1 trong 6 template types")
    sfx: Optional[SfxSpec] = Field(None, description="SFX override cho scene này")

# ── Root Script schema ──────────────────────────────────────────────────
class ScriptMetadataSource(BaseModel):
    url: str
    domain: str
    image: Optional[str] = None

class ScriptMetadata(BaseModel):
    title: str
    source: ScriptMetadataSource
    channel: str = "KNReup News"

class ScriptVoice(BaseModel):
    provider: str = "omnivoice"
    voiceId: str = "vi-VN-HoaiMyNeural"
    speed: float = Field(1.0, ge=0.5, le=2.0)

class VideoScript(BaseModel):
    version: str = Field("1.0", description="Schema version")
    metadata: ScriptMetadata
    voice: ScriptVoice = Field(default_factory=ScriptVoice)
    scenes: List[Scene] = Field(..., description="Danh sách 5-8 scenes tạo nên kịch bản")

# ── Request model ───────────────────────────────────────────────────────
class VideoGenRequest(BaseModel):
    url: str = Field(..., description="URL bài báo hoặc trang web cần cào nội dung")
    theme: str = Field("default", description="Theme / Layout video muốn sử dụng")
    template_set: str = Field("default", description="Template set ID (default, cinematic, news-broadcast, social-media)")
    mode: Optional[str] = Field("auto", description="Chế độ tạo video: auto hoặc manual")
    llm_engine: Optional[str] = Field("ollama", description="LLM Engine sử dụng (ollama, gemini, v.v.)")
    tts_engine: Optional[str] = Field("omnivoice", description="TTS Engine sử dụng (omnivoice, edge-tts, v.v.)")
    voice_id: Optional[str] = Field(None, description="ID của giọng đọc TTS")

# ── Template registry (for UI display) ──────────────────────────────────
AVAILABLE_TEMPLATES = [
    {"id": "hook",           "name": "Hook",           "desc": "Mở đầu gây chú ý — headline + ảnh nền Ken Burns"},
    {"id": "comparison",     "name": "Comparison",     "desc": "So sánh 2 bên đối lập (VS layout)"},
    {"id": "stat-hero",      "name": "Stat Hero",      "desc": "Số liệu lớn nổi bật giữa màn hình"},
    {"id": "feature-list",   "name": "Feature List",   "desc": "Tiêu đề + danh sách bullet points"},
    {"id": "callout",        "name": "Callout",        "desc": "Nhận định mạnh / cảnh báo với tag nổi bật"},
    {"id": "outro",          "name": "Outro",          "desc": "CTA + TikTok follow card + nguồn bài viết"},
    {"id": "quote",          "name": "Quote",          "desc": "Trích dẫn câu nói của nhân vật"},
    {"id": "timeline",       "name": "Timeline",       "desc": "Mốc thời gian sự kiện"},
    {"id": "countdown",      "name": "Countdown",      "desc": "Đếm ngược thời gian nổi bật"},
    {"id": "split-image",    "name": "Split Image",    "desc": "Ảnh một bên, text một bên"},
    {"id": "data-grid",      "name": "Data Grid",      "desc": "Lưới 4 thông số dữ liệu"},
    {"id": "title-card",     "name": "Title Card",     "desc": "Thẻ tiêu đề chuyển cảnh"},
]
