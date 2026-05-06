"""
Build HyperFrames composition HTML from scene configs.
Generates a single index.html ready for `npx hyperframes render`.
"""
import os
import json
from typing import List, Dict, Optional
from textwrap import dedent

# Duration per scene in seconds
DEFAULT_SCENE_DURATION = 4.0

# 6 Theme palettes
THEMES = {
    "tech-blue": {"bg":"#0a0e1a","surface":"#111827","text":"#f0f4ff","muted":"#64748b","accent":"#3b82f6","accentDark":"#1d4ed8","secondary":"#8b5cf6"},
    "growth-green": {"bg":"#061210","surface":"#0a1f1c","text":"#ecfdf5","muted":"#6b8f85","accent":"#10b981","accentDark":"#059669","secondary":"#34d399"},
    "finance-gold": {"bg":"#110f07","surface":"#1c1a0f","text":"#fef9e7","muted":"#a39770","accent":"#f59e0b","accentDark":"#d97706","secondary":"#fbbf24"},
    "warning-red": {"bg":"#120808","surface":"#1e0f0f","text":"#fef2f2","muted":"#a07070","accent":"#ef4444","accentDark":"#dc2626","secondary":"#f87171"},
    "creator-purple": {"bg":"#0d0a14","surface":"#1a1425","text":"#f5f0ff","muted":"#8878a0","accent":"#a855f7","accentDark":"#9333ea","secondary":"#c084fc"},
    "news-mono": {"bg":"#0f0f0f","surface":"#1a1a1a","text":"#e8e8e8","muted":"#777777","accent":"#ffffff","accentDark":"#cccccc","secondary":"#aaaaaa"},
}

# 12 Smart Templates - each has: id, render_html(data, theme), animation_js(scene_id)
SAMPLE_DATA = [
    {"id":"hook","name":"Hook","data":{"headline":"APPLE ĐÃ LÀM GÌ MÀ CẢ THẾ GIỚI SỐC?","subhead":"Sự thật đằng sau thương vụ tỷ đô"}},
    {"id":"stat-hero","name":"Stat Hero","data":{"value":"97%","label":"Người dùng hài lòng","context":"Khảo sát Q4 2025"}},
    {"id":"comparison","name":"Comparison","data":{"left":{"label":"iPhone 16","value":"$799"},"right":{"label":"Galaxy S25","value":"$749"}}},
    {"id":"feature-list","name":"Feature List","data":{"title":"Tính năng nổi bật","bullets":["AI tự động phân tích","Render real-time 4K","Export đa nền tảng","Chỉnh sửa không phá hủy"]}},
    {"id":"callout","name":"Callout","data":{"tag":"CẢNH BÁO","statement":"Hệ thống thanh toán sẽ ngừng hoạt động vào ngày 15/12"}},
    {"id":"outro","name":"Outro","data":{"ctaTop":"THEO DÕI NGAY","channelName":"KNReup News","source":"vnexpress.net"}},
    {"id":"quote","name":"Quote","data":{"text":"Công nghệ tốt nhất là công nghệ mà bạn không nhận ra nó đang ở đó.","author":"— Tim Cook, CEO Apple"}},
    {"id":"timeline","name":"Timeline","data":{"title":"Hành trình phát triển","events":[{"year":"2020","event":"Ra mắt phiên bản đầu tiên"},{"year":"2022","event":"Đạt 1 triệu người dùng"},{"year":"2024","event":"IPO thành công"},{"year":"2025","event":"Mở rộng Đông Nam Á"}]}},
    {"id":"countdown","name":"Countdown","data":{"label":"Thời gian còn lại","number":"03","unit":"NGÀY"}},
    {"id":"split-image","name":"Split Image","data":{"headline":"Trải nghiệm hoàn toàn mới","body":"Giao diện được thiết kế lại từ đầu, tối ưu cho mọi thiết bị."}},
    {"id":"data-grid","name":"Data Grid","data":{"title":"Hiệu suất Q4","cells":[{"value":"2.1M","label":"Lượt xem"},{"value":"+340%","label":"Tăng trưởng"},{"value":"98.7%","label":"Uptime"},{"value":"4.9★","label":"Đánh giá"}]}},
    {"id":"title-card","name":"Title Card","data":{"category":"CÔNG NGHỆ","title":"THẾ GIỚI AI ĐANG THAY ĐỔI","date":"04 Tháng 5, 2025"}},
]


def get_voice_text(scene: dict) -> str:
    """Extract readable text from scene sampleData for TTS."""
    d = scene["data"]
    sid = scene["id"]
    if sid == "hook":
        return f'{d["headline"]}. {d.get("subhead","")}'
    elif sid == "stat-hero":
        return f'{d["value"]} {d["label"]}. {d.get("context","")}'
    elif sid == "comparison":
        return f'{d["left"]["label"]} giá {d["left"]["value"]} so với {d["right"]["label"]} giá {d["right"]["value"]}'
    elif sid == "feature-list":
        return f'{d["title"]}: {", ".join(d["bullets"])}'
    elif sid == "callout":
        return f'{d.get("tag","")}. {d["statement"]}'
    elif sid == "outro":
        return f'{d["ctaTop"]}. Kênh {d["channelName"]}. Nguồn {d["source"]}'
    elif sid == "quote":
        return f'{d["text"]} {d["author"]}'
    elif sid == "timeline":
        evts = ". ".join([f'Năm {e["year"]}, {e["event"]}' for e in d["events"]])
        return f'{d["title"]}. {evts}'
    elif sid == "countdown":
        return f'{d["label"]}: {d["number"]} {d["unit"]}'
    elif sid == "split-image":
        return f'{d["headline"]}. {d["body"]}'
    elif sid == "data-grid":
        cells = ", ".join([f'{c["label"]}: {c["value"]}' for c in d["cells"]])
        return f'{d["title"]}. {cells}'
    elif sid == "title-card":
        return f'{d["category"]}. {d["title"]}. {d.get("date","")}'
    return str(d)


from .template_sets import get_set_module, get_set_meta



def build_composition(
    output_dir: str,
    theme_id: str = "tech-blue",
    template_set: str = "default",
    scenes: Optional[List[dict]] = None,
    durations: Optional[List[float]] = None,
    audio_paths: Optional[List[str]] = None,
) -> str:
    """
    Build a HyperFrames composition HTML file.
    Returns path to the generated index.html.
    """
    if scenes is None:
        scenes = SAMPLE_DATA

    theme = THEMES.get(theme_id, THEMES["tech-blue"])
    n = len(scenes)

    if durations is None:
        durations = [DEFAULT_SCENE_DURATION] * n

    total_duration = sum(durations)
    os.makedirs(output_dir, exist_ok=True)
    
    # Copy hyperframes assets to output_dir
    import shutil
    src_assets = os.path.join(os.path.dirname(__file__), "assets")
    dst_assets = os.path.join(output_dir, "assets")
    if os.path.exists(src_assets):
        os.makedirs(dst_assets, exist_ok=True)
        shutil.copytree(src_assets, dst_assets, dirs_exist_ok=True)

    # Build scene HTML clips and animations
    clips_html = []
    anims_js = []
    audio_html = []
    current_time = 0.0

    # Load set module and metadata
    set_module = get_set_module(template_set)
    meta = get_set_meta(template_set)

    # Build dynamic Google Fonts URL from meta.json
    font_families = meta.get("fonts", ["Inter:wght@400;500;600;700"])
    fonts_param = "&family=".join(font_families)
    google_fonts_url = f"https://fonts.googleapis.com/css2?family={fonts_param}&display=swap"

    # Inject shared features based on meta.json
    features = meta.get("features", [])
    extra_css = ""
    extra_html = ""

    if "grain" in features:
        from .template_sets.shared.grain_overlay import render_grain, grain_css
        extra_html += render_grain()
        extra_css += "\n" + grain_css()

    if "shimmer" in features:
        from .template_sets.shared.shimmer_sweep import shimmer_css
        extra_css += "\n" + shimmer_css()

    # TikTok card: inject CSS for any set that declares the feature
    inject_tiktok_card = "tiktok_card" in features
    if inject_tiktok_card:
        from .template_sets.shared.tiktok_card import render_tiktok_card, tiktok_card_css, tiktok_card_animation
        extra_css += "\n" + tiktok_card_css()

    # Read shell HTML from set_module if available
    shell_html = ""
    if meta.get("shell_html") and hasattr(set_module, 'get_shell_html'):
        shell_html = set_module.get_shell_html()
    
    # Add shared extra HTML
    shell_html += "\n" + extra_html

    # Template sets with their own .scene CSS don't need the default fallback class
    has_custom_scene_css = hasattr(set_module, 'get_shell_html')
    scene_extra_class = "" if has_custom_scene_css else " scene-default"

    # Check if the set module already handles tiktok_card internally (e.g. v2-news)
    set_handles_tiktok = hasattr(set_module, '_HAS_TIKTOK_CARD') or (
        template_set == "v2-news"
    )

    for i, scene in enumerate(scenes):
        sid = scene["id"]
        data = scene["data"]
        dur = durations[i]
        scene_id = f"s{i}"

        inner_html = set_module.render_scene_html(scene_id, sid, data, theme)

        # Inject TikTok card into outro scene if feature is enabled and set doesn't handle it
        if inject_tiktok_card and sid == "outro" and not set_handles_tiktok:
            channel = data.get("channelName", "KNReup News")
            inner_html += "\n" + render_tiktok_card(scene_id, channel_name=channel)

        clips_html.append(f'''
      <!-- Scene {i+1}: {scene.get("name", sid)} -->
      <div id="{scene_id}" class="clip scene{scene_extra_class}" data-start="{current_time}" data-duration="{dur}" data-track-index="0">
        {inner_html}
      </div>''')
        anims_js.append(f'      // Scene {i+1}: {sid}')
        # Make scene visible during its active duration
        anims_js.append(f'      tl.set("#{scene_id}", {{opacity: 1}}, {current_time});')
        anims_js.append(f'      {set_module.render_scene_animation(scene_id, sid, data, current_time)}')

        # Inject TikTok card animation for outro scenes
        if inject_tiktok_card and sid == "outro" and not set_handles_tiktok:
            anims_js.append(f'      {tiktok_card_animation(scene_id, base_time=current_time + 1.6)}')

        anims_js.append(f'      tl.set("#{scene_id}", {{opacity: 0}}, {current_time + dur});')
        if audio_paths and i < len(audio_paths) and audio_paths[i]:
            audio_html.append(
                f'      <audio id="voice-{i}" data-start="{current_time}" '
                f'data-duration="{dur}" data-track-index="1" '
                f'src="{audio_paths[i]}"></audio>'
            )

        current_time += dur

    # Read CSS from set_module (already loaded above)
    scene_css = set_module.get_css() + extra_css

    # Pre-compute joined strings to avoid f-string restrictions
    clips_joined = "".join(clips_html)
    anims_joined = "\n".join(anims_js)
    audio_section = "\n".join(audio_html) if audio_html else "      <!-- No audio tracks -->"

    composition_html = f'''<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <link href="{google_fonts_url}" rel="stylesheet">
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{
        margin: 0; width: 1080px; height: 1920px;
        overflow: hidden;
        background: {theme["bg"]};
        font-family: 'Manrope', sans-serif;
        color: {theme["text"]};
      }}
      .scene {{
        position: absolute; inset: 0;
        box-sizing: border-box;
      }}
      /* Fallback layout for template sets without their own .scene CSS */
      .scene-default {{
        display: flex; flex-direction: column;
        justify-content: center; align-items: center;
        padding: 80px;
        word-break: break-word;
      }}
{scene_css}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total_duration}" data-width="1080" data-height="1920">
{shell_html}

{clips_joined}

{audio_section}
    </div>

    <script>
      window.__timelines = window.__timelines || {{}};
      const tl = gsap.timeline({{ paused: true }});

{anims_joined}

      window.__timelines["main"] = tl;
    </script>
  </body>
</html>'''

    output_path = os.path.join(output_dir, "index.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(composition_html)

    # Also write package.json and hyperframes.json
    pkg = {"name":"knreup-preview-render","private":True,"type":"module",
           "scripts":{"render":"npx --yes hyperframes@0.4.43 render"}}
    with open(os.path.join(output_dir, "package.json"), "w") as f:
        json.dump(pkg, f, indent=2)

    hf_config = {"$schema":"https://hyperframes.heygen.com/schema/hyperframes.json",
                 "registry":"https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
                 "paths":{"blocks":"compositions","components":"compositions/components","assets":"assets"}}
    with open(os.path.join(output_dir, "hyperframes.json"), "w") as f:
        json.dump(hf_config, f, indent=2)

    return output_path
