import os

def render_scene_html(scene_id: str, sid: str, data: dict, theme: dict) -> str:
    t = theme
    html = f'''<div class="news-content" style="z-index:1;position:relative;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;">
    '''

    if sid == "hook":
        if data.get("bgSrc"):
            html += f'<div class="bg kb-zoom-in" style="position:absolute;inset:0;background-image:url(\'{data["bgSrc"]}\');background-size:cover;background-position:center;opacity:0.3;z-index:-1;"></div>\n        '
        html += f'''<div class="news-lower-third" style="position:absolute;bottom:100px;left:0;right:0;background:rgba({_hex_to_rgb(t["surface"])},0.95);border-left:12px solid {t["accent"]};padding:40px 60px;">
          <div id="{scene_id}-h" class="news-headline" style="color:{t["text"]}">{data.get("headline","")}</div>
          <div id="{scene_id}-s" class="news-subhead" style="color:{t["accent"]}">{data.get("subhead","")}</div>
        </div>'''
    elif sid == "stat-hero":
        html += f'''<div style="display:flex;flex-direction:column;align-items:center;background:{t["surface"]};padding:80px;border-top:8px solid {t["accent"]};width:80%;">
          <div id="{scene_id}-v" class="news-stat-value" style="color:{t["accent"]}">{data.get("value","")}</div>
          <div id="{scene_id}-l" class="news-stat-label" style="color:{t["text"]}">{data.get("label","")}</div>
          <div id="{scene_id}-c" class="news-stat-context" style="color:{t["muted"]}">{data.get("context","")}</div>
        </div>'''
    elif sid == "comparison":
        lv = str(data["left"]["value"])
        rv = str(data["right"]["value"])
        html += f'''<div id="{scene_id}-w" class="news-comp-wrap" style="display:flex;width:100%;padding:0 40px;gap:20px;">
          <div class="news-comp-side" style="background:{t["surface"]};border-left:12px solid {t["accent"]};padding:40px;flex:1;">
            <div class="news-comp-label" style="color:{t["muted"]}">{data["left"]["label"]}</div>
            <div class="news-comp-value" style="color:{t["text"]}">{lv}</div>
          </div>
          <div class="news-comp-vs" style="background:{t["text"]};color:{t["bg"]};font-size:40px;align-self:center;padding:8px 24px;font-family:'Inter',sans-serif;font-weight:800;">VS</div>
          <div class="news-comp-side" style="background:{t["surface"]};border-left:12px solid {t.get("secondary", t["muted"])};padding:40px;flex:1;">
            <div class="news-comp-label" style="color:{t["muted"]}">{data["right"]["label"]}</div>
            <div class="news-comp-value" style="color:{t["text"]}">{rv}</div>
          </div>
        </div>'''
    elif sid == "feature-list":
        html += f'<div class="news-breaking-bar" style="background:#dc2626;color:#fff;align-self:flex-start;margin-left:60px;">BREAKING</div>'
        html += f'<div id="{scene_id}-t" class="news-feat-title" style="color:{t["text"]}">{data.get("title","")}</div><div style="width:100%;padding:0 60px;">'
        for i, b in enumerate(data.get("bullets", [])):
            html += f'\n        <div id="{scene_id}-b{i}" class="news-feat-item" style="color:{t["text"]};background:{t["surface"]}"><div class="news-feat-bullet" style="background:{t["accent"]}"></div> {b}</div>'
        html += '</div>'
    elif sid == "callout":
        tag_html = ""
        if data.get("tag"):
            tag_html = f'<div class="news-callout-tag" style="background:{t["accent"]};color:{t["bg"]}">{data["tag"]}</div>'
        html += f'<div id="{scene_id}-box" class="news-callout-box" style="background:{t["surface"]};border-left:16px solid {t["accent"]}">{tag_html}<div class="news-callout-statement" style="color:{t["text"]}">{data.get("statement","")}</div></div>'
    elif sid == "outro":
        html += f'''<div class="news-breaking-bar" style="background:#dc2626;color:#fff;margin-bottom:40px;">UPDATE</div>
        <div id="{scene_id}-cta" class="news-outro-cta" style="color:{t["text"]}">{data.get("ctaTop","")}</div>
        <div id="{scene_id}-ch" class="news-outro-channel" style="color:{t["accent"]}">{data.get("channelName","")}</div>
        <div id="{scene_id}-src" class="news-outro-source" style="background:{t["surface"]};color:{t["muted"]}">{data.get("source","")}</div>'''
    elif sid == "quote":
        html += f'''<div id="{scene_id}-wrap" class="news-quote-wrap" style="background:{t["surface"]};border-left:12px solid {t["accent"]}">
        <div class="news-quote-mark" style="color:{t["accent"]}">"</div>
        <div id="{scene_id}-txt" class="news-quote-text" style="color:{t["text"]}">{data.get("text","")}</div>
        <div id="{scene_id}-auth" class="news-quote-author" style="color:{t["muted"]}">{data.get("author","")}</div>
        </div>'''
    elif sid == "timeline":
        html += f'<div class="news-breaking-bar" style="background:#dc2626;color:#fff;align-self:flex-start;margin-left:60px;">TIMELINE</div>'
        html += f'<div id="{scene_id}-t" class="news-tl-title" style="color:{t["text"]}">{data.get("title","")}</div><div style="width:100%;padding:0 60px;">'
        for i, ev in enumerate(data.get("events", [])):
            html += f'\n        <div id="{scene_id}-r{i}" class="news-tl-row" style="background:{t["surface"]}"><div class="news-tl-year" style="color:{t["bg"]};background:{t["accent"]}">{ev.get("year","")}</div><div class="news-tl-event" style="color:{t["text"]}">{ev.get("event","")}</div></div>'
        html += '</div>'
    elif sid == "countdown":
        html += f'''<div class="news-cd-wrap" style="background:{t["surface"]};border-top:12px solid {t["accent"]}">
        <div id="{scene_id}-lbl" class="news-cd-label" style="color:{t["text"]}">{data.get("label","")}</div>
        <div id="{scene_id}-num" class="news-cd-number" style="color:{t["accent"]}">{data.get("number","")}</div>
        <div id="{scene_id}-unit" class="news-cd-unit" style="color:{t["muted"]}">{data.get("unit","")}</div>
        </div>'''
    elif sid == "split-image":
        html += f'''<div class="news-split-wrap">
          <div id="{scene_id}-img" class="news-split-img" style="background:{t["surface"]};border-right:8px solid {t["accent"]}"></div>
          <div class="news-split-text-zone" style="background:{t["surface"]};border-left:8px solid {t["accent"]}">
            <div id="{scene_id}-hl" class="news-split-headline" style="color:{t["text"]}">{data.get("headline","")}</div>
            <div id="{scene_id}-bd" class="news-split-body" style="color:{t["muted"]}">{data.get("body","")}</div>
          </div>
        </div>'''
    elif sid == "data-grid":
        cells = ""
        for i, c in enumerate(data.get("cells", [])):
            cells += f'\n          <div id="{scene_id}-c{i}" class="news-dg-cell" style="background:{t["surface"]}"><div class="news-dg-value" style="color:{t["accent"]}">{c.get("value","")}</div><div class="news-dg-label" style="color:{t["muted"]}">{c.get("label","")}</div></div>'
        html += f'<div class="news-breaking-bar" style="background:#dc2626;color:#fff;align-self:flex-start;margin-left:60px;">DATA</div>'
        html += f'<div id="{scene_id}-t" class="news-dg-title" style="color:{t["text"]}">{data.get("title","")}</div>\n        <div class="news-dg-grid">{cells}\n        </div>'
    elif sid == "title-card":
        html += f'''<div id="{scene_id}-wrap" class="news-tc-wrap" style="background:{t["surface"]};border-left:16px solid {t["accent"]}">
        <div id="{scene_id}-cat" class="news-tc-category" style="color:{t["accent"]}">{data.get("category","")}</div>
        <div id="{scene_id}-title" class="news-tc-title" style="color:{t["text"]}">{data.get("title","")}</div>
        <div id="{scene_id}-date" class="news-tc-date" style="color:{t["muted"]}">{data.get("date","")}</div>
        </div>'''
    else:
        html += f'<div style="color:{t["text"]}">News Template: {sid}</div>'

    html += '\n    </div>'
    return html

def _hex_to_rgb(h: str) -> str:
    h = h.lstrip('#')
    if len(h) == 3: h = h[0]*2 + h[1]*2 + h[2]*2
    if len(h) != 6: return "0,0,0"
    return f"{int(h[0:2], 16)}, {int(h[2:4], 16)}, {int(h[4:6], 16)}"

def render_scene_animation(scene_id: str, sid: str, data: dict, start: float) -> str:
    s = start
    js = ""

    if sid == "hook":
        js += f'tl.from("#{scene_id} .news-lower-third",{{x:-100,opacity:0,duration:0.6,ease:"power3.out"}},{s});'
        js += f'\n      tl.from("#{scene_id}-h",{{opacity:0,x:-30,duration:0.5}},{s+0.3});'
        js += f'\n      tl.from("#{scene_id}-s",{{opacity:0,x:-20,duration:0.4}},{s+0.6});'
    elif sid == "stat-hero":
        js += f'tl.from("#{scene_id} > div",{{y:50,opacity:0,duration:0.6,ease:"power3.out"}},{s});'
        js += f'\n      tl.from("#{scene_id}-v",{{scale:0.8,opacity:0,duration:0.5,ease:"back.out(1.5)"}},{s+0.3});'
        js += f'\n      tl.from("#{scene_id}-l",{{opacity:0,duration:0.4}},{s+0.6});'
        if data.get("context"):
            js += f'\n      tl.from("#{scene_id}-c",{{opacity:0,duration:0.4}},{s+0.8});'
    elif sid == "comparison":
        js += f'tl.from("#{scene_id}-w .news-comp-side:first-child",{{x:-100,opacity:0,duration:0.6,ease:"power3.out"}},{s});\n      tl.from("#{scene_id}-w .news-comp-side:last-child",{{x:100,opacity:0,duration:0.6,ease:"power3.out"}},{s});\n      tl.from("#{scene_id}-w .news-comp-vs",{{scale:0,opacity:0,duration:0.4,ease:"back.out(2)"}},{s+0.4});'
    elif sid == "feature-list":
        js += f'tl.from("#{scene_id} .news-breaking-bar",{{x:-50,opacity:0,duration:0.4}},{s});'
        js += f'\n      tl.from("#{scene_id}-t",{{opacity:0,x:-30,duration:0.5}},{s+0.2});'
        for i in range(len(data.get("bullets",[]))):
            js += f'\n      tl.from("#{scene_id}-b{i}",{{opacity:0,x:-50,duration:0.4,ease:"power2.out"}},{s+0.4+i*0.15});'
    elif sid == "callout":
        js += f'tl.from("#{scene_id}-box",{{x:-100,opacity:0,duration:0.6,ease:"power3.out"}},{s});'
    elif sid == "outro":
        js += f'tl.from("#{scene_id} .news-breaking-bar",{{y:-30,opacity:0,duration:0.4}},{s});\n      tl.from("#{scene_id}-cta",{{opacity:0,x:-30,duration:0.5}},{s+0.2});\n      tl.from("#{scene_id}-ch",{{opacity:0,scale:0.9,duration:0.5,ease:"back.out(1.2)"}},{s+0.4});\n      tl.from("#{scene_id}-src",{{opacity:0,y:20,duration:0.4}},{s+0.7});'
    elif sid == "quote":
        js += f'tl.from("#{scene_id}-wrap",{{x:-100,opacity:0,duration:0.6,ease:"power3.out"}},{s});\n      tl.from("#{scene_id}-txt",{{opacity:0,duration:0.5}},{s+0.4});\n      tl.from("#{scene_id}-auth",{{opacity:0,duration:0.4}},{s+0.7});'
    elif sid == "timeline":
        js += f'tl.from("#{scene_id} .news-breaking-bar",{{x:-50,opacity:0,duration:0.4}},{s});'
        js += f'\n      tl.from("#{scene_id}-t",{{opacity:0,x:-30,duration:0.5}},{s+0.2});'
        for i in range(len(data.get("events",[]))):
            js += f'\n      tl.from("#{scene_id}-r{i}",{{opacity:0,x:-50,duration:0.4,ease:"power2.out"}},{s+0.4+i*0.15});'
    elif sid == "countdown":
        js += f'tl.from("#{scene_id} .news-cd-wrap",{{y:50,opacity:0,duration:0.6,ease:"power3.out"}},{s});\n      tl.from("#{scene_id}-lbl",{{opacity:0,duration:0.4}},{s+0.3});\n      tl.from("#{scene_id}-num",{{scale:0.5,opacity:0,duration:0.6,ease:"back.out(1.5)"}},{s+0.5});\n      tl.from("#{scene_id}-unit",{{opacity:0,duration:0.4}},{s+0.8});'
    elif sid == "split-image":
        js += f'tl.from("#{scene_id}-img",{{x:-50,opacity:0,duration:0.6,ease:"power3.out"}},{s});\n      tl.from("#{scene_id} .news-split-text-zone",{{x:50,opacity:0,duration:0.6,ease:"power3.out"}},{s});\n      tl.from("#{scene_id}-hl",{{opacity:0,duration:0.5}},{s+0.4});\n      tl.from("#{scene_id}-bd",{{opacity:0,duration:0.4}},{s+0.6});'
    elif sid == "data-grid":
        js += f'tl.from("#{scene_id} .news-breaking-bar",{{x:-50,opacity:0,duration:0.4}},{s});'
        js += f'\n      tl.from("#{scene_id}-t",{{opacity:0,x:-30,duration:0.5}},{s+0.2});'
        for i in range(len(data.get("cells",[]))):
            js += f'\n      tl.from("#{scene_id}-c{i}",{{opacity:0,y:30,duration:0.4,ease:"power2.out"}},{s+0.4+i*0.1});'
    elif sid == "title-card":
        js += f'tl.from("#{scene_id}-wrap",{{x:-100,opacity:0,duration:0.6,ease:"power3.out"}},{s});\n      tl.from("#{scene_id}-cat",{{opacity:0,duration:0.4}},{s+0.3});\n      tl.from("#{scene_id}-title",{{opacity:0,y:20,duration:0.5}},{s+0.5});\n      tl.from("#{scene_id}-date",{{opacity:0,duration:0.4}},{s+0.8});'

    return js

def get_css() -> str:
    return """
/* News Broadcast CSS */
.news-headline { font-family: 'Inter', sans-serif; font-size: 60px; font-weight: 800; line-height: 1.1; text-transform: uppercase; margin-bottom: 12px; }
.news-subhead { font-family: 'Inter', sans-serif; font-size: 32px; font-weight: 500; }

.news-stat-value { font-family: 'Inter', sans-serif; font-size: 160px; font-weight: 900; line-height: 1; letter-spacing: -2px; }
.news-stat-label { font-family: 'Inter', sans-serif; font-size: 40px; font-weight: 800; text-transform: uppercase; margin-top: 10px; }
.news-stat-context { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 500; margin-top: 20px; text-transform: uppercase; background: #000; padding: 4px 12px; display: inline-block; }

.news-comp-label { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; }
.news-comp-value { font-family: 'Inter', sans-serif; font-size: 60px; font-weight: 900; line-height: 1; }

.news-breaking-bar { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 900; padding: 8px 24px; letter-spacing: 4px; display: inline-block; }
.news-feat-title { font-family: 'Inter', sans-serif; font-size: 60px; font-weight: 800; text-transform: uppercase; margin-top: 20px; margin-bottom: 40px; align-self: flex-start; margin-left: 60px; }
.news-feat-item { font-family: 'Inter', sans-serif; font-size: 32px; font-weight: 600; padding: 24px 32px; margin-bottom: 16px; display: flex; align-items: center; gap: 24px; width: 100%; border-left: 8px solid transparent; }
.news-feat-bullet { width: 16px; height: 16px; flex-shrink: 0; }

.news-callout-box { width: 85%; padding: 50px 60px; }
.news-callout-tag { font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 800; padding: 6px 16px; text-transform: uppercase; display: inline-block; margin-bottom: 24px; }
.news-callout-statement { font-family: 'Inter', sans-serif; font-size: 50px; font-weight: 800; line-height: 1.3; }

.news-outro-cta { font-family: 'Inter', sans-serif; font-size: 32px; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; }
.news-outro-channel { font-family: 'Inter', sans-serif; font-size: 90px; font-weight: 900; margin-bottom: 40px; }
.news-outro-source { font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 600; padding: 8px 20px; text-transform: uppercase; }

.news-quote-wrap { width: 85%; padding: 60px; }
.news-quote-mark { font-family: 'Inter', sans-serif; font-size: 120px; font-weight: 900; line-height: 0.5; margin-bottom: 20px; }
.news-quote-text { font-family: 'Inter', sans-serif; font-size: 44px; font-weight: 600; line-height: 1.4; margin-bottom: 40px; }
.news-quote-author { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 800; text-transform: uppercase; }

.news-tl-title { font-family: 'Inter', sans-serif; font-size: 60px; font-weight: 800; text-transform: uppercase; margin-top: 20px; margin-bottom: 40px; align-self: flex-start; margin-left: 60px; }
.news-tl-row { display: flex; align-items: center; width: 100%; margin-bottom: 16px; }
.news-tl-year { font-family: 'Inter', sans-serif; font-size: 32px; font-weight: 900; padding: 24px 32px; width: 180px; text-align: center; }
.news-tl-event { font-family: 'Inter', sans-serif; font-size: 32px; font-weight: 600; padding: 24px 32px; flex: 1; }

.news-cd-wrap { width: 80%; padding: 60px; display: flex; flex-direction: column; align-items: center; }
.news-cd-label { font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; }
.news-cd-number { font-family: 'Inter', sans-serif; font-size: 200px; font-weight: 900; line-height: 1; margin-bottom: 20px; }
.news-cd-unit { font-family: 'Inter', sans-serif; font-size: 32px; font-weight: 800; text-transform: uppercase; }

.news-split-wrap { display: flex; flex-direction: column; width: 100%; height: 100%; padding: 80px 40px; gap: 40px; justify-content: center; }
.news-split-img { width: 100%; height: 500px; }
.news-split-text-zone { padding: 50px; }
.news-split-headline { font-family: 'Inter', sans-serif; font-size: 50px; font-weight: 800; margin-bottom: 20px; text-transform: uppercase; }
.news-split-body { font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 500; line-height: 1.5; }

.news-dg-title { font-family: 'Inter', sans-serif; font-size: 60px; font-weight: 800; text-transform: uppercase; margin-top: 20px; margin-bottom: 40px; align-self: flex-start; margin-left: 60px; }
.news-dg-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; padding: 0 60px; }
.news-dg-cell { padding: 40px; display: flex; flex-direction: column; justify-content: center; border-left: 8px solid transparent; }
.news-dg-value { font-family: 'Inter', sans-serif; font-size: 70px; font-weight: 900; line-height: 1; margin-bottom: 10px; }
.news-dg-label { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 800; text-transform: uppercase; }

.news-tc-wrap { width: 85%; padding: 60px 80px; }
.news-tc-category { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; }
.news-tc-title { font-family: 'Inter', sans-serif; font-size: 70px; font-weight: 900; line-height: 1.1; text-transform: uppercase; margin-bottom: 30px; }
.news-tc-date { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 600; text-transform: uppercase; }

.kb-zoom-in { animation: kb-zoom-in var(--scene-dur, 15s) linear forwards; }
@keyframes kb-zoom-in { from { transform: scale(1.0); } to { transform: scale(1.18); } }
"""
