import os

def render_scene_html(scene_id: str, sid: str, data: dict, theme: dict) -> str:
    t = theme
    html = f'''<div class="social-content" style="z-index:1;position:relative;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;">
    '''

    if sid == "hook":
        html += f'<div id="{scene_id}-h" class="social-headline social-glow" style="color:{t["text"]};text-shadow:0 0 20px {t["accent"]}, 0 0 40px {t["accent"]}80">{data.get("headline","")}</div>'
        if data.get("subhead"):
            html += f'\n        <div id="{scene_id}-s" class="social-subhead" style="color:{t["accent"]}">{data["subhead"]}</div>'
    elif sid == "stat-hero":
        html += f'<div id="{scene_id}-v" class="social-stat-value social-glow" style="color:{t["text"]};text-shadow:0 0 20px {t["accent"]}, 0 0 40px {t["accent"]}80">{data.get("value","")}</div>'
        html += f'\n        <div id="{scene_id}-l" class="social-stat-label" style="color:{t["accent"]}">{data.get("label","")}</div>'
        if data.get("context"):
            html += f'\n        <div id="{scene_id}-c" class="social-stat-context" style="color:{t["muted"]}">{data["context"]}</div>'
    elif sid == "comparison":
        lv = str(data["left"]["value"])
        rv = str(data["right"]["value"])
        html += f'''<div id="{scene_id}-w" class="social-comp-wrap">
          <div class="social-comp-side" style="background:{t["surface"]};border:2px solid {t["accent"]};box-shadow:0 0 20px {t["accent"]}40">
            <div class="social-comp-label" style="color:{t["accent"]}">{data["left"]["label"]}</div>
            <div class="social-comp-value social-glow" style="color:{t["text"]};text-shadow:0 0 10px {t["accent"]}">{lv}</div>
          </div>
          <div class="social-comp-vs" style="background:linear-gradient(135deg,{t["accent"]},{t.get("secondary", t["muted"])});color:{t["bg"]}">VS</div>
          <div class="social-comp-side" style="background:{t["surface"]};border:2px solid {t.get("secondary", t["muted"])};box-shadow:0 0 20px {t.get("secondary", t["muted"])}40">
            <div class="social-comp-label" style="color:{t.get("secondary", t["muted"])}">{data["right"]["label"]}</div>
            <div class="social-comp-value social-glow" style="color:{t["text"]};text-shadow:0 0 10px {t.get("secondary", t["muted"])}">{rv}</div>
          </div>
        </div>'''
    elif sid == "feature-list":
        html += f'<div id="{scene_id}-t" class="social-feat-title" style="color:{t["accent"]}">{data.get("title","")}</div>'
        emojis = ["🚀", "✨", "💎", "🎯", "⚡"]
        for i, b in enumerate(data.get("bullets", [])):
            emoji = emojis[i % len(emojis)]
            html += f'\n        <div id="{scene_id}-b{i}" class="social-feat-item" style="color:{t["text"]};background:{t["surface"]};border:1px solid {t["accent"]}40"><span class="social-feat-emoji">{emoji}</span> {b}</div>'
    elif sid == "callout":
        tag_html = ""
        if data.get("tag"):
            tag_html = f'<div class="social-callout-tag" style="background:{t["accent"]};color:{t["bg"]}">{data["tag"]}</div>'
        html += f'<div id="{scene_id}-box" class="social-callout-box" style="background:{t["surface"]};border:2px solid {t["accent"]};box-shadow:0 0 30px {t["accent"]}60">{tag_html}<div class="social-callout-statement" style="color:{t["text"]}">{data.get("statement","")}</div></div>'
    elif sid == "outro":
        html += f'''<div id="{scene_id}-cta" class="social-outro-cta" style="color:{t["text"]}">{data.get("ctaTop","")}</div>
        <div id="{scene_id}-ch" class="social-outro-channel social-glow" style="color:{t["text"]};text-shadow:0 0 20px {t["accent"]}, 0 0 40px {t["accent"]}80">{data.get("channelName","")}</div>
        <div id="{scene_id}-src" class="social-outro-source" style="color:{t["muted"]}">{data.get("source","")}</div>'''
    elif sid == "quote":
        html += f'''<div id="{scene_id}-wrap" class="social-quote-wrap" style="background:{t["surface"]};border:2px solid {t["accent"]}">
        <div class="social-quote-mark" style="color:{t["accent"]}">"</div>
        <div id="{scene_id}-txt" class="social-quote-text" style="color:{t["text"]}">{data.get("text","")}</div>
        <div id="{scene_id}-auth" class="social-quote-author" style="color:{t["accent"]}">{data.get("author","")}</div>
        </div>'''
    elif sid == "timeline":
        html += f'<div id="{scene_id}-t" class="social-tl-title" style="color:{t["accent"]}">{data.get("title","")}</div>'
        for i, ev in enumerate(data.get("events", [])):
            html += f'\n        <div id="{scene_id}-r{i}" class="social-tl-row" style="background:{t["surface"]};border:1px solid {t["accent"]}40"><div class="social-tl-year" style="color:{t["bg"]};background:{t["accent"]}">{ev.get("year","")}</div><div class="social-tl-event" style="color:{t["text"]}">{ev.get("event","")}</div></div>'
    elif sid == "countdown":
        html += f'''<div id="{scene_id}-lbl" class="social-cd-label" style="color:{t["text"]}">{data.get("label","")}</div>
        <div id="{scene_id}-num" class="social-cd-number social-glow" style="color:{t["text"]};text-shadow:0 0 20px {t["accent"]}, 0 0 40px {t["accent"]}80">{data.get("number","")}</div>
        <div id="{scene_id}-unit" class="social-cd-unit" style="color:{t["accent"]}">{data.get("unit","")}</div>'''
    elif sid == "split-image":
        html += f'''<div class="social-split-wrap">
          <div id="{scene_id}-img" class="social-split-img" style="border:4px solid {t["accent"]};box-shadow:0 0 20px {t["accent"]}40"></div>
          <div class="social-split-text-zone">
            <div id="{scene_id}-hl" class="social-split-headline" style="color:{t["text"]};text-shadow:0 0 10px {t["accent"]}">{data.get("headline","")}</div>
            <div id="{scene_id}-bd" class="social-split-body" style="color:{t["muted"]}">{data.get("body","")}</div>
          </div>
        </div>'''
    elif sid == "data-grid":
        cells = ""
        for i, c in enumerate(data.get("cells", [])):
            cells += f'\n          <div id="{scene_id}-c{i}" class="social-dg-cell" style="background:{t["surface"]};border:1px solid {t["accent"]}40"><div class="social-dg-value social-glow" style="color:{t["text"]};text-shadow:0 0 10px {t["accent"]}">{c.get("value","")}</div><div class="social-dg-label" style="color:{t["muted"]}">{c.get("label","")}</div></div>'
        html += f'<div id="{scene_id}-t" class="social-dg-title" style="color:{t["accent"]}">{data.get("title","")}</div>\n        <div class="social-dg-grid">{cells}\n        </div>'
    elif sid == "title-card":
        html += f'''<div id="{scene_id}-wrap" class="social-tc-wrap" style="background:{t["surface"]};border:2px solid {t["accent"]};box-shadow:0 0 30px {t["accent"]}60">
        <div id="{scene_id}-cat" class="social-tc-category" style="color:{t["accent"]}">{data.get("category","")}</div>
        <div id="{scene_id}-title" class="social-tc-title social-glow" style="color:{t["text"]};text-shadow:0 0 20px {t["accent"]}">{data.get("title","")}</div>
        <div id="{scene_id}-date" class="social-tc-date" style="color:{t["muted"]}">{data.get("date","")}</div>
        </div>'''
    else:
        html += f'<div style="color:{t["text"]}">Social Template: {sid}</div>'

    html += '\n    </div>'
    return html

def render_scene_animation(scene_id: str, sid: str, data: dict, start: float) -> str:
    s = start
    js = ""

    if sid == "hook":
        js += f'tl.from("#{scene_id}-h",{{scale:0.3,opacity:0,duration:0.6,ease:"back.out(2)"}},{s});'
        js += f'\n      tl.from("#{scene_id}-s",{{y:30,opacity:0,duration:0.4,ease:"power2.out"}},{s+0.3});'
    elif sid == "stat-hero":
        js += f'tl.from("#{scene_id}-v",{{scale:0,opacity:0,duration:0.7,ease:"elastic.out(1,0.5)"}},{s});'
        js += f'\n      tl.from("#{scene_id}-l",{{y:20,opacity:0,duration:0.4}},{s+0.3});'
        if data.get("context"):
            js += f'\n      tl.from("#{scene_id}-c",{{y:20,opacity:0,duration:0.4}},{s+0.5});'
    elif sid == "comparison":
        js += f'tl.from("#{scene_id}-w .social-comp-side:first-child",{{y:100,opacity:0,duration:0.5,ease:"back.out(1.5)"}},{s});\n      tl.from("#{scene_id}-w .social-comp-side:last-child",{{y:100,opacity:0,duration:0.5,ease:"back.out(1.5)"}},{s+0.2});\n      tl.from("#{scene_id}-w .social-comp-vs",{{scale:0,rotation:180,opacity:0,duration:0.5,ease:"back.out(2)"}},{s+0.4});'
    elif sid == "feature-list":
        js += f'tl.from("#{scene_id}-t",{{y:-30,opacity:0,duration:0.4,ease:"back.out(1.5)"}},{s});'
        for i in range(len(data.get("bullets",[]))):
            js += f'\n      tl.from("#{scene_id}-b{i}",{{x:50,scale:0.8,opacity:0,duration:0.4,ease:"back.out(1.5)"}},{s+0.2+i*0.1});'
    elif sid == "callout":
        js += f'tl.from("#{scene_id}-box",{{scale:0.5,opacity:0,duration:0.6,ease:"back.out(1.5)"}},{s});'
    elif sid == "outro":
        js += f'tl.from("#{scene_id}-cta",{{y:-20,opacity:0,duration:0.4}},{s});\n      tl.from("#{scene_id}-ch",{{scale:0.3,opacity:0,duration:0.7,ease:"elastic.out(1,0.5)"}},{s+0.2});\n      tl.from("#{scene_id}-src",{{y:20,opacity:0,duration:0.4}},{s+0.5});'
    elif sid == "quote":
        js += f'tl.from("#{scene_id}-wrap",{{scale:0.8,opacity:0,duration:0.5,ease:"back.out(1.2)"}},{s});\n      tl.from("#{scene_id}-txt",{{y:30,opacity:0,duration:0.4}},{s+0.3});\n      tl.from("#{scene_id}-auth",{{y:20,opacity:0,duration:0.4}},{s+0.5});'
    elif sid == "timeline":
        js += f'tl.from("#{scene_id}-t",{{y:-30,opacity:0,duration:0.4,ease:"back.out(1.5)"}},{s});'
        for i in range(len(data.get("events",[]))):
            js += f'\n      tl.from("#{scene_id}-r{i}",{{y:30,scale:0.9,opacity:0,duration:0.4,ease:"back.out(1.5)"}},{s+0.2+i*0.15});'
    elif sid == "countdown":
        js += f'tl.from("#{scene_id}-lbl",{{y:-20,opacity:0,duration:0.4}},{s});\n      tl.from("#{scene_id}-num",{{scale:0,rotation:-10,opacity:0,duration:0.8,ease:"elastic.out(1,0.4)"}},{s+0.2});\n      tl.from("#{scene_id}-unit",{{y:20,opacity:0,duration:0.4}},{s+0.5});'
    elif sid == "split-image":
        js += f'tl.from("#{scene_id}-img",{{scale:0.8,opacity:0,duration:0.5,ease:"back.out(1.2)"}},{s});\n      tl.from("#{scene_id}-hl",{{y:30,opacity:0,duration:0.4}},{s+0.3});\n      tl.from("#{scene_id}-bd",{{y:20,opacity:0,duration:0.4}},{s+0.5});'
    elif sid == "data-grid":
        js += f'tl.from("#{scene_id}-t",{{y:-30,opacity:0,duration:0.4,ease:"back.out(1.5)"}},{s});'
        for i in range(len(data.get("cells",[]))):
            js += f'\n      tl.from("#{scene_id}-c{i}",{{scale:0.5,opacity:0,duration:0.5,ease:"back.out(1.5)"}},{s+0.2+i*0.1});'
    elif sid == "title-card":
        js += f'tl.from("#{scene_id}-wrap",{{scale:0.5,rotation:2,opacity:0,duration:0.6,ease:"back.out(1.2)"}},{s});\n      tl.from("#{scene_id}-cat",{{y:-20,opacity:0,duration:0.4}},{s+0.3});\n      tl.from("#{scene_id}-title",{{scale:0.8,opacity:0,duration:0.5,ease:"back.out(1.5)"}},{s+0.5});\n      tl.from("#{scene_id}-date",{{y:20,opacity:0,duration:0.4}},{s+0.7});'

    return js

def get_css() -> str:
    return """
/* Social Media CSS */
.social-headline { font-family: 'Manrope', sans-serif; font-size: 80px; font-weight: 800; line-height: 1.1; text-align: center; text-transform: uppercase; padding: 0 40px; margin-bottom: 20px; }
.social-subhead { font-family: 'Manrope', sans-serif; font-size: 36px; font-weight: 600; text-align: center; padding: 0 60px; }

.social-stat-value { font-family: 'Manrope', sans-serif; font-size: 200px; font-weight: 800; line-height: 1; letter-spacing: -4px; margin-bottom: 10px; }
.social-stat-label { font-family: 'Manrope', sans-serif; font-size: 44px; font-weight: 700; text-transform: uppercase; }
.social-stat-context { font-family: 'Manrope', sans-serif; font-size: 28px; font-weight: 500; margin-top: 20px; opacity: 0.8; }

.social-comp-wrap { display: flex; width: 100%; padding: 0 40px; justify-content: center; align-items: center; gap: 20px; }
.social-comp-side { flex: 1; border-radius: 24px; padding: 50px 30px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.social-comp-label { font-family: 'Manrope', sans-serif; font-size: 32px; font-weight: 700; text-transform: uppercase; margin-bottom: 20px; }
.social-comp-value { font-family: 'Manrope', sans-serif; font-size: 70px; font-weight: 800; line-height: 1; text-align: center; }
.social-comp-vs { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Manrope', sans-serif; font-size: 28px; font-weight: 800; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 10; box-shadow: 0 10px 20px rgba(0,0,0,0.3); }

.social-feat-title { font-family: 'Manrope', sans-serif; font-size: 60px; font-weight: 800; text-transform: uppercase; margin-bottom: 40px; text-align: center; }
.social-feat-item { font-family: 'Manrope', sans-serif; font-size: 32px; font-weight: 600; padding: 24px 32px; margin-bottom: 20px; border-radius: 20px; display: flex; align-items: center; gap: 20px; width: 80%; }
.social-feat-emoji { font-size: 40px; }

.social-callout-box { width: 85%; padding: 60px; border-radius: 30px; text-align: center; }
.social-callout-tag { font-family: 'Manrope', sans-serif; font-size: 24px; font-weight: 800; padding: 8px 24px; border-radius: 20px; text-transform: uppercase; display: inline-block; margin-bottom: 30px; }
.social-callout-statement { font-family: 'Manrope', sans-serif; font-size: 56px; font-weight: 800; line-height: 1.3; }

.social-outro-cta { font-family: 'Manrope', sans-serif; font-size: 36px; font-weight: 700; text-transform: uppercase; margin-bottom: 20px; }
.social-outro-channel { font-family: 'Manrope', sans-serif; font-size: 100px; font-weight: 800; margin-bottom: 40px; text-align: center; padding: 0 40px; }
.social-outro-source { font-family: 'Manrope', sans-serif; font-size: 24px; font-weight: 500; opacity: 0.7; }

.social-quote-wrap { width: 85%; padding: 60px; border-radius: 30px; display: flex; flex-direction: column; align-items: center; text-align: center; }
.social-quote-mark { font-family: 'Manrope', sans-serif; font-size: 100px; font-weight: 800; line-height: 0.5; margin-bottom: 30px; }
.social-quote-text { font-family: 'Manrope', sans-serif; font-size: 48px; font-weight: 600; line-height: 1.4; margin-bottom: 40px; }
.social-quote-author { font-family: 'Manrope', sans-serif; font-size: 28px; font-weight: 700; text-transform: uppercase; }

.social-tl-title { font-family: 'Manrope', sans-serif; font-size: 60px; font-weight: 800; text-transform: uppercase; margin-bottom: 40px; text-align: center; }
.social-tl-row { display: flex; align-items: center; width: 85%; margin-bottom: 20px; border-radius: 20px; overflow: hidden; }
.social-tl-year { font-family: 'Manrope', sans-serif; font-size: 32px; font-weight: 800; padding: 30px; width: 160px; text-align: center; }
.social-tl-event { font-family: 'Manrope', sans-serif; font-size: 32px; font-weight: 600; padding: 30px; flex: 1; }

.social-cd-label { font-family: 'Manrope', sans-serif; font-size: 36px; font-weight: 700; text-transform: uppercase; margin-bottom: 20px; }
.social-cd-number { font-family: 'Manrope', sans-serif; font-size: 240px; font-weight: 800; line-height: 1; margin-bottom: 20px; }
.social-cd-unit { font-family: 'Manrope', sans-serif; font-size: 40px; font-weight: 800; text-transform: uppercase; }

.social-split-wrap { display: flex; flex-direction: column; width: 100%; height: 100%; padding: 60px 40px; gap: 40px; justify-content: center; }
.social-split-img { width: 100%; height: 500px; border-radius: 30px; }
.social-split-text-zone { padding: 20px; text-align: center; }
.social-split-headline { font-family: 'Manrope', sans-serif; font-size: 56px; font-weight: 800; margin-bottom: 20px; text-transform: uppercase; line-height: 1.2; }
.social-split-body { font-family: 'Manrope', sans-serif; font-size: 32px; font-weight: 500; line-height: 1.5; opacity: 0.9; }

.social-dg-title { font-family: 'Manrope', sans-serif; font-size: 60px; font-weight: 800; text-transform: uppercase; margin-bottom: 40px; text-align: center; }
.social-dg-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; width: 100%; padding: 0 40px; }
.social-dg-cell { padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 24px; text-align: center; }
.social-dg-value { font-family: 'Manrope', sans-serif; font-size: 64px; font-weight: 800; line-height: 1; margin-bottom: 12px; }
.social-dg-label { font-family: 'Manrope', sans-serif; font-size: 24px; font-weight: 700; text-transform: uppercase; opacity: 0.9; }

.social-tc-wrap { width: 85%; padding: 80px 60px; border-radius: 40px; text-align: center; }
.social-tc-category { font-family: 'Manrope', sans-serif; font-size: 28px; font-weight: 800; text-transform: uppercase; margin-bottom: 24px; letter-spacing: 2px; }
.social-tc-title { font-family: 'Manrope', sans-serif; font-size: 76px; font-weight: 800; line-height: 1.1; text-transform: uppercase; margin-bottom: 40px; }
.social-tc-date { font-family: 'Manrope', sans-serif; font-size: 28px; font-weight: 600; text-transform: uppercase; opacity: 0.7; }
"""
