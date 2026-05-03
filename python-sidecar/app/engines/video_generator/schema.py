from enum import Enum
from typing import List, Optional, Any, Union, Literal, Annotated
from pydantic import BaseModel, Field

# ── Template data shapes (discriminated by template field) ───────────────
# Aligning exactly with Auto-Create-Video's 6 implemented templates

# ─── 1. HOOK ─────────────────────────────────────────────────────────────
class HookTemplateData(BaseModel):
    template: Literal["hook"] = "hook"
    headline: str = Field(..., max_length=40, description="Tiêu đề ngắn gọn gây chú ý")
    subhead: Optional[str] = Field(None, max_length=40, description="Phụ đề bên dưới headline")
    bgSrc: Optional[str] = Field(None, description="Đường dẫn ảnh nền ($source.image → thay thế tự động)")
    kenBurns: Optional[str] = Field("zoom-in", description="Hiệu ứng Ken Burns: zoom-in, zoom-out, pan-left, pan-right")

# ─── 2. COMPARISON ───────────────────────────────────────────────────────
class ComparisonSide(BaseModel):
    label: str = Field(..., max_length=30)
    value: str = Field(..., max_length=20)
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
    value: str = Field(..., max_length=20, description="Con số chính (VD: '97%', '$2.1B')")
    label: str = Field(..., max_length=40, description="Nhãn mô tả con số")
    context: Optional[str] = Field(None, max_length=50, description="Ngữ cảnh bổ sung")

# ─── 4. FEATURE LIST ─────────────────────────────────────────────────────
class FeatureListData(BaseModel):
    template: Literal["feature-list"] = "feature-list"
    title: str = Field(..., max_length=40, description="Tiêu đề danh sách")
    bullets: List[str] = Field(..., min_length=1, max_length=4, description="Danh sách 1-4 bullet points")
    icon: Optional[str] = Field(None, description="Icon tùy chọn")

# ─── 5. CALLOUT ──────────────────────────────────────────────────────────
class CalloutTemplateData(BaseModel):
    template: Literal["callout"] = "callout"
    statement: str = Field(..., max_length=80, description="Câu nhận định mạnh")
    tag: Optional[str] = Field(None, max_length=20, description="Tag nhỏ (VD: 'CẢNH BÁO', 'QUAN TRỌNG')")

# ─── 6. OUTRO ────────────────────────────────────────────────────────────
class OutroTemplateData(BaseModel):
    template: Literal["outro"] = "outro"
    ctaTop: str = Field(..., max_length=30, description="Call to action text")
    channelName: str = Field(..., max_length=30, description="Tên kênh")
    source: str = Field(..., max_length=40, description="Nguồn bài viết")

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
    template: Optional[str] = Field("default", description="Template video muốn sử dụng")
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
]
