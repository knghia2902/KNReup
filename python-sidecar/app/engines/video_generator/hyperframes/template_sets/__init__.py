"""Template Sets registry for HyperFrames composition."""
from typing import Dict, Callable, Tuple

# Each set module exports:
# - render_scene_html(scene_id, sid, data, theme) -> str
# - render_scene_animation(scene_id, sid, data, start) -> str
# - get_css() -> str

from . import default_set
from . import cinematic_set
from . import news_broadcast_set
from . import social_media_set

TEMPLATE_SET_MODULES = {
    "default": default_set,
    "cinematic": cinematic_set,
    "news-broadcast": news_broadcast_set,
    "social-media": social_media_set,
}

TEMPLATE_SET_INFO = [
    {"id": "default", "name": "Default", "description": "Standard templates"},
    {"id": "cinematic", "name": "Cinematic", "description": "Dark dramatic style"},
    {"id": "news-broadcast", "name": "News Broadcast", "description": "TV news style"},
    {"id": "social-media", "name": "Social Media", "description": "TikTok/Reels style"},
]

def get_set_module(set_id: str):
    """Get template set module by ID. Falls back to default."""
    return TEMPLATE_SET_MODULES.get(set_id, default_set)
