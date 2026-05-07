import os

def render_scene_html(scene_id: str, sid: str, data: dict, theme: dict) -> str:
    t = theme
    html = f'''<div class="cine-letterbox-top"></div>
    <div class="cine-letterbox-bot"></div>
    <div class="cine-content" style="z-index:1;position:relative;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;">
    '''

    if sid == "hook":
        if data.get("bgSrc"):
            html += f'<div class="bg-blur" style="position:absolute;inset:0;background-image:url(\'{data["bgSrc"]}\');background-size:cover;background-position:center;filter:blur(35px);opacity:0.35;transform:scale(1.1);z-index:-2;"></div>\n            <div class="bg" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:1040px;height:585px;background-image:url(\'{data["bgSrc"]}\');background-size:cover;background-position:center;border-radius:20px;box-shadow:0 20px 40px rgba(0,0,0,0.4);opacity:0.9;z-index:-1;"></div>\n        '
        html += f'<div id="{scene_id}-h" class="cine-headline" style="color:{t["text"]}">{data.get("headline","")}</div>'
        if data.get("subhead"):
            html += f'\n        <div id="{scene_id}-s" class="cine-subhead" style="color:{t["accent"]}">{data["subhead"]}</div>'
    elif sid == "stat-hero":
        html += f'<div id="{scene_id}-v" class="cine-stat-value" style="color:{t["accent"]}">{data.get("value","")}</div>'
        html += f'\n        <div id="{scene_id}-l" class="cine-stat-label" style="color:{t["text"]}">{data.get("label","")}</div>'
        if data.get("context"):
            html += f'\n        <div id="{scene_id}-c" class="cine-stat-context" style="color:{t["muted"]}">{data["context"]}</div>'
    elif sid == "comparison":
        lv = str(data["left"]["value"])
        rv = str(data["right"]["value"])
        html += f'''<div id="{scene_id}-w" class="cine-comp-wrap">
          <div class="cine-comp-side" style="border-left-color:{t["accent"]}">
            <div class="cine-comp-label">{data["left"]["label"]}</div>
            <div class="cine-comp-value" style="color:{t["accent"]}">{lv}</div>
          </div>
          <div class="cine-comp-vs">VS</div>
          <div class="cine-comp-side" style="border-left-color:{t["secondary"]}">
            <div class="cine-comp-label">{data["right"]["label"]}</div>
            <div class="cine-comp-value" style="color:{t["secondary"]}">{rv}</div>
          </div>
        </div>'''
    elif sid == "feature-list":
        html += f'<div id="{scene_id}-t" class="cine-feat-title" style="color:{t["accent"]}">{data.get("title","")}</div>'
        for i, b in enumerate(data.get("bullets", [])):
            html += f'\n        <div id="{scene_id}-b{i}" class="cine-feat-item" style="color:{t["text"]}"><span class="cine-feat-bullet" style="color:{t["accent"]}">■</span> {b}</div>'
    elif sid == "callout":
        tag_html = ""
        if data.get("tag"):
            tag_html = f'<div class="cine-callout-tag" style="color:{t["accent"]}">{data["tag"]}</div>'
        html += f'<div id="{scene_id}-box" class="cine-callout-box" style="border-left:8px solid {t["accent"]};background:linear-gradient(90deg,{t["accent"]}22,transparent)">{tag_html}<div class="cine-callout-statement" style="color:{t["text"]}">{data.get("statement","")}</div></div>'
    elif sid == "outro":
        html += f'''<div id="{scene_id}-cta" class="cine-outro-cta" style="color:{t["accent"]}">{data.get("ctaTop","")}</div>
        <div id="{scene_id}-ch" class="cine-outro-channel" style="color:{t["text"]}">{data.get("channelName","")}</div>
        <div id="{scene_id}-src" class="cine-outro-source" style="color:{t["muted"]}">Nguồn: {data.get("source","")}</div>'''
    elif sid == "quote":
        html += f'''<div id="{scene_id}-mark" class="cine-quote-mark" style="color:{t["accent"]}">&ldquo;</div>
        <div id="{scene_id}-txt" class="cine-quote-text" style="color:{t["text"]}">{data.get("text","")}</div>
        <div id="{scene_id}-auth" class="cine-quote-author" style="color:{t["accent"]}">{data.get("author","")}</div>'''
    elif sid == "timeline":
        html += f'<div id="{scene_id}-t" class="cine-tl-title" style="color:{t["text"]}">{data.get("title","")}</div>'
        for i, ev in enumerate(data.get("events", [])):
            if i > 0:
                html += f'\n        <div class="cine-tl-line" style="background:{t["accent"]}55"></div>'
            html += f'\n        <div id="{scene_id}-r{i}" class="cine-tl-row"><div class="cine-tl-year" style="color:{t["accent"]}">{ev.get("year","")}</div><div class="cine-tl-event" style="color:{t["text"]}">{ev.get("event","")}</div></div>'
    elif sid == "countdown":
        html += f'''<div id="{scene_id}-lbl" class="cine-cd-label" style="color:{t["muted"]}">{data.get("label","")}</div>
        <div id="{scene_id}-num" class="cine-cd-number" style="color:{t["accent"]}">{data.get("number","")}</div>
        <div id="{scene_id}-unit" class="cine-cd-unit" style="color:{t["text"]}">{data.get("unit","")}</div>'''
    elif sid == "split-image":
        html += f'''<div class="cine-split-wrap">
          <div id="{scene_id}-img" class="cine-split-img" style="border: 2px solid {t["accent"]}55"></div>
          <div class="cine-split-text-zone">
            <div id="{scene_id}-hl" class="cine-split-headline" style="color:{t["text"]}">{data.get("headline","")}</div>
            <div id="{scene_id}-bd" class="cine-split-body" style="color:{t["muted"]}">{data.get("body","")}</div>
          </div>
        </div>'''
    elif sid == "data-grid":
        cells = ""
        for i, c in enumerate(data.get("cells", [])):
            cells += f'\n          <div id="{scene_id}-c{i}" class="cine-dg-cell" style="border-top:2px solid {t["accent"]}55"><div class="cine-dg-value" style="color:{t["accent"]}">{c.get("value","")}</div><div class="cine-dg-label" style="color:{t["muted"]}">{c.get("label","")}</div></div>'
        html += f'<div id="{scene_id}-t" class="cine-dg-title" style="color:{t["text"]}">{data.get("title","")}</div>\n        <div class="cine-dg-grid">{cells}\n        </div>'
    elif sid == "title-card":
        html += f'''<div id="{scene_id}-cat" class="cine-tc-category" style="color:{t["accent"]}">{data.get("category","")}</div>
        <div id="{scene_id}-title" class="cine-tc-title" style="color:{t["text"]}">{data.get("title","")}</div>
        <div id="{scene_id}-date" class="cine-tc-date" style="color:{t["muted"]}">{data.get("date","")}</div>'''
    else:
        html += f'<div style="color:{t["text"]}">Cinematic Template: {sid}</div>'

    html += '\n    </div>'
    return html

def render_scene_animation(scene_id: str, sid: str, data: dict, start: float) -> str:
    s = start
    # Common slow letterbox animation
    js = f'''
    tl.fromTo("#{scene_id} .cine-letterbox-top", {{y:-100}}, {{y:0, duration:1.5, ease:"power2.out"}}, {s});
    tl.fromTo("#{scene_id} .cine-letterbox-bot", {{y:100}}, {{y:0, duration:1.5, ease:"power2.out"}}, {s});
    '''

    if sid == "hook":
        js += f'tl.from("#{scene_id}-h",{{opacity:0, scale:0.95, duration:1.5, ease:"power2.out"}},{s+0.5});'
        js += f'\n      tl.from("#{scene_id}-s",{{opacity:0, y:20, duration:1.2, ease:"power2.out"}},{s+1.0});'
    elif sid == "stat-hero":
        js += f'tl.from("#{scene_id}-v",{{opacity:0, y:40, duration:1.5, ease:"power3.out"}},{s+0.5});'
        js += f'\n      tl.from("#{scene_id}-l",{{opacity:0, duration:1.0}},{s+1.0});'
        if data.get("context"):
            js += f'\n      tl.from("#{scene_id}-c",{{opacity:0, duration:1.0}},{s+1.5});'
    elif sid == "comparison":
        js += f'tl.from("#{scene_id}-w",{{opacity:0, duration:1.0}},{s+0.5});\n      tl.from("#{scene_id}-w .cine-comp-side:first-child",{{x:-50,opacity:0,duration:1.2,ease:"power2.out"}},{s+0.8});\n      tl.from("#{scene_id}-w .cine-comp-side:last-child",{{x:50,opacity:0,duration:1.2,ease:"power2.out"}},{s+1.2});'
    elif sid == "feature-list":
        js += f'tl.from("#{scene_id}-t",{{opacity:0, duration:1.0}},{s+0.5});'
        for i in range(len(data.get("bullets",[]))):
            js += f'\n      tl.from("#{scene_id}-b{i}",{{opacity:0, y:20, duration:0.8, ease:"power2.out"}},{s+1.0+i*0.4});'
    elif sid == "callout":
        js += f'tl.from("#{scene_id}-box",{{opacity:0, scale:1.05, duration:1.5, ease:"power2.out"}},{s+0.5});'
    elif sid == "outro":
        js += f'tl.from("#{scene_id}-cta",{{opacity:0, duration:1.0}},{s+0.5});\n      tl.from("#{scene_id}-ch",{{opacity:0, y:30, duration:1.2, ease:"power2.out"}},{s+1.0});\n      tl.from("#{scene_id}-src",{{opacity:0, duration:1.0}},{s+1.5});'
    elif sid == "quote":
        js += f'tl.from("#{scene_id}-mark",{{opacity:0, duration:1.0}},{s+0.5});\n      tl.from("#{scene_id}-txt",{{opacity:0, duration:1.5, ease:"power2.out"}},{s+1.0});\n      tl.from("#{scene_id}-auth",{{opacity:0, duration:1.0}},{s+2.0});'
    elif sid == "timeline":
        js += f'tl.from("#{scene_id}-t",{{opacity:0, duration:1.0}},{s+0.5});'
        for i in range(len(data.get("events",[]))):
            js += f'\n      tl.from("#{scene_id}-r{i}",{{opacity:0, y:20, duration:1.0, ease:"power2.out"}},{s+1.0+i*0.5});'
    elif sid == "countdown":
        js += f'tl.from("#{scene_id}-lbl",{{opacity:0, duration:1.0}},{s+0.5});\n      tl.from("#{scene_id}-num",{{opacity:0, scale:0.9, duration:1.5, ease:"power2.out"}},{s+1.0});\n      tl.from("#{scene_id}-unit",{{opacity:0, duration:1.0}},{s+1.5});'
    elif sid == "split-image":
        js += f'tl.from("#{scene_id}-img",{{opacity:0, duration:1.5, ease:"power2.out"}},{s+0.5});\n      tl.from("#{scene_id}-hl",{{opacity:0, y:20, duration:1.0}},{s+1.0});\n      tl.from("#{scene_id}-bd",{{opacity:0, duration:1.0}},{s+1.5});'
    elif sid == "data-grid":
        js += f'tl.from("#{scene_id}-t",{{opacity:0, duration:1.0}},{s+0.5});'
        for i in range(len(data.get("cells",[]))):
            js += f'\n      tl.from("#{scene_id}-c{i}",{{opacity:0, y:20, duration:1.0, ease:"power2.out"}},{s+1.0+i*0.3});'
    elif sid == "title-card":
        js += f'tl.from("#{scene_id}-cat",{{opacity:0, duration:1.0}},{s+0.5});\n      tl.from("#{scene_id}-title",{{opacity:0, scale:1.05, duration:1.5, ease:"power2.out"}},{s+1.0});\n      tl.from("#{scene_id}-date",{{opacity:0, duration:1.0}},{s+2.0});'

    return js

def get_css() -> str:
    return """
/* Cinematic CSS */
.cine-letterbox-top, .cine-letterbox-bot {
    position: absolute;
    width: 100%;
    height: 120px;
    background: #000;
    z-index: 10;
}
.cine-letterbox-top { top: 0; }
.cine-letterbox-bot { bottom: 0; }

.cine-headline { font-family: 'Bebas Neue', sans-serif; font-size: 110px; line-height: 1.1; text-align: center; text-transform: uppercase; letter-spacing: 4px; padding: 0 40px; }
.cine-subhead { font-family: 'Inter', sans-serif; font-size: 36px; font-weight: 300; text-align: center; margin-top: 40px; letter-spacing: 8px; text-transform: uppercase; }

.cine-stat-value { font-family: 'Bebas Neue', sans-serif; font-size: 220px; line-height: 1; letter-spacing: 6px; }
.cine-stat-label { font-family: 'Inter', sans-serif; font-size: 48px; font-weight: 300; text-transform: uppercase; letter-spacing: 8px; margin-top: 20px; text-align: center; }
.cine-stat-context { font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 300; letter-spacing: 4px; margin-top: 30px; text-transform: uppercase; }

.cine-comp-wrap { display: flex; width: 100%; padding: 0 60px; justify-content: center; gap: 40px; }
.cine-comp-side { flex: 1; border-left-width: 4px; border-left-style: solid; padding-left: 40px; display: flex; flex-direction: column; justify-content: center; }
.cine-comp-label { font-family: 'Inter', sans-serif; font-size: 32px; font-weight: 300; text-transform: uppercase; letter-spacing: 4px; }
.cine-comp-value { font-family: 'Bebas Neue', sans-serif; font-size: 100px; line-height: 1.1; letter-spacing: 4px; margin-top: 20px; }
.cine-comp-vs { font-family: 'Inter', sans-serif; font-size: 40px; font-weight: 100; align-self: center; margin: 0 40px; opacity: 0.5; }

.cine-feat-title { font-family: 'Bebas Neue', sans-serif; font-size: 80px; letter-spacing: 4px; text-align: center; margin-bottom: 60px; }
.cine-feat-item { font-family: 'Inter', sans-serif; font-size: 42px; font-weight: 300; margin-bottom: 30px; display: flex; align-items: center; gap: 30px; }
.cine-feat-bullet { font-size: 24px; opacity: 0.8; }

.cine-callout-box { width: 90%; padding: 60px 80px; }
.cine-callout-tag { font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 400; letter-spacing: 8px; text-transform: uppercase; margin-bottom: 20px; }
.cine-callout-statement { font-family: 'Bebas Neue', sans-serif; font-size: 80px; line-height: 1.2; letter-spacing: 2px; }

.cine-outro-cta { font-family: 'Inter', sans-serif; font-size: 36px; font-weight: 300; letter-spacing: 12px; text-transform: uppercase; margin-bottom: 40px; }
.cine-outro-channel { font-family: 'Bebas Neue', sans-serif; font-size: 140px; letter-spacing: 8px; margin-bottom: 60px; }
.cine-outro-source { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; }

.cine-quote-mark { font-family: 'Bebas Neue', sans-serif; font-size: 200px; line-height: 0.5; opacity: 0.2; margin-bottom: 40px; }
.cine-quote-text { font-family: 'Inter', sans-serif; font-size: 56px; font-weight: 300; line-height: 1.4; text-align: center; padding: 0 80px; font-style: italic; }
.cine-quote-author { font-family: 'Inter', sans-serif; font-size: 32px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; margin-top: 60px; text-align: center; }

.cine-tl-title { font-family: 'Bebas Neue', sans-serif; font-size: 80px; letter-spacing: 4px; text-align: center; margin-bottom: 80px; }
.cine-tl-row { display: flex; align-items: baseline; gap: 60px; width: 100%; padding: 0 40px; }
.cine-tl-year { font-family: 'Bebas Neue', sans-serif; font-size: 70px; letter-spacing: 4px; width: 200px; text-align: right; }
.cine-tl-event { font-family: 'Inter', sans-serif; font-size: 40px; font-weight: 300; flex: 1; }
.cine-tl-line { width: 2px; height: 40px; margin: 20px 0 20px 240px; }

.cine-cd-label { font-family: 'Inter', sans-serif; font-size: 36px; font-weight: 300; letter-spacing: 8px; text-transform: uppercase; margin-bottom: 40px; text-align: center; }
.cine-cd-number { font-family: 'Bebas Neue', sans-serif; font-size: 300px; line-height: 1; letter-spacing: 10px; margin-bottom: 40px; }
.cine-cd-unit { font-family: 'Inter', sans-serif; font-size: 40px; font-weight: 300; letter-spacing: 12px; text-transform: uppercase; }

.cine-split-wrap { display: flex; flex-direction: column; width: 100%; gap: 60px; }
.cine-split-img { width: 100%; height: 600px; background: #111; }
.cine-split-text-zone { display: flex; flex-direction: column; gap: 30px; }
.cine-split-headline { font-family: 'Bebas Neue', sans-serif; font-size: 80px; letter-spacing: 4px; }
.cine-split-body { font-family: 'Inter', sans-serif; font-size: 36px; font-weight: 300; line-height: 1.5; }

.cine-dg-title { font-family: 'Bebas Neue', sans-serif; font-size: 80px; letter-spacing: 4px; text-align: center; margin-bottom: 80px; }
.cine-dg-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px 80px; width: 100%; padding: 0 40px; }
.cine-dg-cell { display: flex; flex-direction: column; padding-top: 30px; gap: 20px; }
.cine-dg-value { font-family: 'Bebas Neue', sans-serif; font-size: 90px; line-height: 1; letter-spacing: 4px; }
.cine-dg-label { font-family: 'Inter', sans-serif; font-size: 30px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; }

.cine-tc-category { font-family: 'Inter', sans-serif; font-size: 32px; font-weight: 300; letter-spacing: 12px; text-transform: uppercase; margin-bottom: 40px; }
.cine-tc-title { font-family: 'Bebas Neue', sans-serif; font-size: 120px; line-height: 1.1; letter-spacing: 6px; text-align: center; margin-bottom: 60px; padding: 0 40px; }
.cine-tc-date { font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 300; letter-spacing: 8px; text-transform: uppercase; opacity: 0.6; }

.kb-zoom-in { animation: kb-zoom-in var(--scene-dur, 15s) linear forwards; }
@keyframes kb-zoom-in { from { transform: scale(1.0); } to { transform: scale(1.0); } }
"""
