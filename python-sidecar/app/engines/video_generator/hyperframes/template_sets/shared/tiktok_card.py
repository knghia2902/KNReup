"""TikTok Follow Card — reusable lower-third component."""

def render_tiktok_card(
    scene_id: str,
    channel_name: str = "KNReup News",
    handle: str = "@knreup",
    followers: str = "1.2M followers",
    avatar_url: str = "assets/avatar.png",
) -> str:
    """Return HTML string for TikTok Follow Card."""
    return f'''<div id="{scene_id}-tt-card" class="tt-card">
      <img class="tt-avatar" src="{avatar_url}" alt="{channel_name}" crossorigin="anonymous" />
      <div class="tt-profile-info">
        <div class="tt-display-name">{channel_name}</div>
        <div class="tt-handle">{handle}</div>
        <div class="tt-followers">{followers}</div>
      </div>
      <div id="{scene_id}-tt-follow-btn" class="tt-follow-btn">
        <span id="{scene_id}-tt-btn-follow" class="tt-btn-text">Follow</span>
        <span id="{scene_id}-tt-btn-following" class="tt-btn-text tt-btn-text-following">
          <span>Following</span>
          <span class="tt-check-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
        </span>
      </div>
    </div>'''


def tiktok_card_css() -> str:
    """CSS for TikTok Follow Card — scoped via .tt-card class."""
    return """
.tt-card {
  position: absolute;
  bottom: 160px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 30px;
  background: #1a1a1a;
  border-radius: 75px;
  padding: 25px 40px 25px 25px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.4);
  z-index: 50;
  opacity: 0;
  width: max-content;
  max-width: 900px;
}
.tt-avatar { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 3px solid #333; }
.tt-profile-info { display: flex; flex-direction: column; gap: 2px; margin-right: 20px; white-space: nowrap; }
.tt-display-name { font-size: 42px; font-weight: 700; color: #fff; line-height: 1.3; }
.tt-handle { font-size: 28px; color: #a0a0a0; line-height: 1.3; }
.tt-followers { font-size: 25px; color: #737373; line-height: 1.3; }
.tt-follow-btn { position: relative; width: 250px; height: 80px; border-radius: 40px; background: #fe2c55; flex-shrink: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.tt-btn-text { position: absolute; font-size: 30px; font-weight: 700; color: #fff; white-space: nowrap; }
.tt-btn-text-following { opacity: 0; display: flex; align-items: center; gap: 8px; }
.tt-check-icon { display: inline-block; width: 22px; height: 22px; }
.tt-check-icon svg { width: 22px; height: 22px; display: block; }
"""


def tiktok_card_animation(scene_id: str, base_time: float) -> str:
    """GSAP animation sequence: slide-in → hold → button press → text swap."""
    s = base_time
    return f"""tl.fromTo("#{scene_id}-tt-card", {{ opacity: 0, y: 300, xPercent: -50 }}, {{ opacity: 1, y: 0, xPercent: -50, duration: 0.5 }}, {s});
tl.to("#{scene_id}-tt-follow-btn", {{ scale: 0.92, duration: 0.15 }}, {s + 0.9});
tl.to("#{scene_id}-tt-follow-btn", {{ scale: 1, duration: 0.4 }}, {s + 1.05});
tl.to("#{scene_id}-tt-btn-follow", {{ opacity: 0, duration: 0.08 }}, {s + 1.05});
tl.to("#{scene_id}-tt-btn-following", {{ opacity: 1, duration: 0.08 }}, {s + 1.08});"""
