import os

def render_scene_html(scene_id: str, sid: str, data: dict, theme: dict) -> str:
    """Generate inner HTML for one scene."""
    t = theme
    if sid == "hook":
        bg_html = ""
        if data.get("bgSrc"):
            bg_html = f'<div class="bg-blur" style="position:absolute;inset:0;background-image:url(\'{data["bgSrc"]}\');background-size:cover;background-position:center;filter:blur(35px);opacity:0.3;transform:scale(1.1);z-index:-2;"></div>\n            <div class="bg" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:1040px;height:585px;background-image:url(\'{data["bgSrc"]}\');background-size:cover;background-position:center;border-radius:20px;box-shadow:0 20px 40px rgba(0,0,0,0.4);opacity:0.9;z-index:-1;"></div>'
        html = f'{bg_html}\n        <div id="{scene_id}-h" class="hook-headline" style="color:{t["text"]}">{data["headline"]}</div>'
        if data.get("subhead"):
            html += f'\n        <div id="{scene_id}-s" class="hook-subhead" style="color:{t["accent"]}">{data["subhead"]}</div>'
        return html
    elif sid == "stat-hero":
        html = f'<div id="{scene_id}-v" class="stat-value" style="color:{t["accent"]}">{data["value"]}</div>'
        html += f'\n        <div id="{scene_id}-l" class="stat-label" style="color:{t["text"]}">{data["label"]}</div>'
        if data.get("context"):
            html += f'\n        <div id="{scene_id}-c" class="stat-context" style="color:{t["muted"]}">{data["context"]}</div>'
        return html
    elif sid == "comparison":
        # Adaptive font size based on text length
        def _comp_font(val: str) -> str:
            length = len(val)
            if length <= 10: return "88px"
            elif length <= 25: return "56px"
            else: return "40px"
        lv = str(data["left"]["value"])
        rv = str(data["right"]["value"])
        return f'''<div id="{scene_id}-w" class="comparison-wrapper">
          <div class="comp-side" style="border-color:{t["accent"]}">
            <div class="comp-label">{data["left"]["label"]}</div>
            <div class="comp-value" style="color:{t["accent"]};font-size:{_comp_font(lv)}">{lv}</div>
          </div>
          <div class="comp-vs">VS</div>
          <div class="comp-side" style="border-color:{t["secondary"]}">
            <div class="comp-label">{data["right"]["label"]}</div>
            <div class="comp-value" style="color:{t["secondary"]};font-size:{_comp_font(rv)}">{rv}</div>
          </div>
        </div>'''
    elif sid == "feature-list":
        bullets_html = ""
        for i, b in enumerate(data["bullets"]):
            bullets_html += f'\n        <div id="{scene_id}-b{i}" class="feature-item" style="color:{t["text"]}"><div class="feature-bullet" style="background:{t["accent"]}"></div>{b}</div>'
        return f'<div id="{scene_id}-t" class="feature-title" style="color:{t["accent"]}">{data["title"]}</div>{bullets_html}'
    elif sid == "callout":
        tag_html = ""
        if data.get("tag"):
            tag_html = f'<div class="callout-tag" style="color:rgba(255,255,255,0.7)">{data["tag"]}</div>'
        return f'<div id="{scene_id}-box" class="callout-box" style="background:linear-gradient(135deg,{t["accent"]},{t["accentDark"]}88)">{tag_html}<div class="callout-statement" style="color:#fff">{data["statement"]}</div></div>'
    elif sid == "outro":
        return f'''<div id="{scene_id}-cta" class="outro-cta" style="color:{t["accent"]}">{data["ctaTop"]}</div>
        <div id="{scene_id}-ch" class="outro-channel" style="background:{t["text"]};color:{t["bg"]}">{data["channelName"]}</div>
        <div id="{scene_id}-src" class="outro-source" style="color:{t["muted"]}">Nguồn: {data["source"]}</div>'''
    elif sid == "quote":
        return f'''<div id="{scene_id}-mark" class="quote-mark" style="color:{t["accent"]}">"</div>
        <div id="{scene_id}-txt" class="quote-text" style="color:{t["text"]}">{data["text"]}</div>
        <div id="{scene_id}-auth" class="quote-author" style="color:{t["accent"]}">{data["author"]}</div>'''
    elif sid == "timeline":
        rows = ""
        for i, ev in enumerate(data["events"]):
            if i > 0:
                rows += f'\n        <div class="tl-line" style="background:{t["accent"]}"></div>'
            rows += f'\n        <div id="{scene_id}-r{i}" class="tl-row"><div class="tl-dot" style="background:{t["accent"]}"></div><div class="tl-year" style="color:{t["accent"]}">{ev["year"]}</div><div class="tl-event" style="color:{t["text"]}">{ev["event"]}</div></div>'
        return f'<div id="{scene_id}-t" class="tl-title" style="color:{t["text"]}">{data["title"]}</div>{rows}'
    elif sid == "countdown":
        return f'''<div id="{scene_id}-lbl" class="cd-label" style="color:{t["muted"]}">{data["label"]}</div>
        <div id="{scene_id}-num" class="cd-number" style="color:{t["accent"]}">{data["number"]}</div>
        <div id="{scene_id}-unit" class="cd-unit" style="color:{t["text"]}">{data["unit"]}</div>'''
    elif sid == "split-image":
        return f'''<div class="split-wrap">
          <div id="{scene_id}-img" class="split-img" style="background:linear-gradient(135deg,{t["accent"]}44,{t["accentDark"]}22)"><div class="split-img-placeholder">🎞️</div></div>
          <div class="split-text-zone">
            <div id="{scene_id}-hl" class="split-headline" style="color:{t["text"]}">{data["headline"]}</div>
            <div id="{scene_id}-bd" class="split-body" style="color:{t["muted"]}">{data["body"]}</div>
          </div>
        </div>'''
    elif sid == "data-grid":
        cells = ""
        for i, c in enumerate(data["cells"]):
            cells += f'\n          <div id="{scene_id}-c{i}" class="dg-cell" style="border-color:{t["accent"]}33"><div class="dg-cell-value" style="color:{t["accent"]}">{c["value"]}</div><div class="dg-cell-label" style="color:{t["muted"]}">{c["label"]}</div></div>'
        return f'<div id="{scene_id}-t" class="dg-title" style="color:{t["text"]}">{data["title"]}</div>\n        <div class="dg-grid">{cells}\n        </div>'
    elif sid == "title-card":
        return f'''<div id="{scene_id}-cat" class="tc-category" style="color:{t["accent"]}">{data["category"]}</div>
        <div id="{scene_id}-title" class="tc-title" style="color:{t["text"]}">{data["title"]}</div>
        <div id="{scene_id}-div" class="tc-divider" style="background:{t["accent"]}"></div>
        <div id="{scene_id}-date" class="tc-date" style="color:{t["muted"]}">{data.get("date","")}</div>'''
    return f'<div style="color:{t["text"]}">Template: {sid}</div>'

def render_scene_animation(scene_id: str, sid: str, data: dict, start: float) -> str:
    """Generate GSAP animation JS for one scene."""
    s = start
    if sid == "hook":
        js = f'tl.from("#{scene_id}-h",{{opacity:0,y:50,duration:0.8,ease:"power4.out"}},{s});'
        js += f'\n      tl.from("#{scene_id}-s",{{opacity:0,duration:0.7}},{s+0.5});'
        return js
    elif sid == "stat-hero":
        js = f'tl.from("#{scene_id}-v",{{opacity:0,scale:0.5,duration:1,ease:"elastic.out(1,0.5)"}},{s});'
        js += f'\n      tl.from("#{scene_id}-l",{{opacity:0,duration:0.5}},{s+0.5});'
        if data.get("context"):
            js += f'\n      tl.from("#{scene_id}-c",{{opacity:0,duration:0.4}},{s+0.8});'
        return js
    elif sid == "comparison":
        return f'tl.from("#{scene_id}-w",{{opacity:0,duration:0.4}},{s});\n      tl.from("#{scene_id}-w .comp-side:first-child",{{y:80,opacity:0,duration:0.7,ease:"back.out(1.7)"}},{s+0.3});\n      tl.from("#{scene_id}-w .comp-side:last-child",{{y:80,opacity:0,duration:0.7,ease:"back.out(1.7)"}},{s+0.5});'
    elif sid == "feature-list":
        js = f'tl.from("#{scene_id}-t",{{opacity:0,duration:0.5}},{s});'
        for i in range(len(data.get("bullets",[]))):
            js += f'\n      tl.from("#{scene_id}-b{i}",{{opacity:0,x:-40,duration:0.45}},{s+0.4+i*0.25});'
        return js
    elif sid == "callout":
        return f'tl.from("#{scene_id}-box",{{opacity:0,y:80,duration:0.9,ease:"power4.out"}},{s});'
    elif sid == "outro":
        return f'tl.from("#{scene_id}-cta",{{opacity:0,duration:0.5}},{s});\n      tl.from("#{scene_id}-ch",{{opacity:0,scale:0.8,duration:0.7,ease:"elastic.out(1,0.5)"}},{s+0.3});\n      tl.from("#{scene_id}-src",{{opacity:0,duration:0.4}},{s+0.7});'
    elif sid == "quote":
        return f'tl.to("#{scene_id}-mark",{{opacity:0.2,duration:0.4}},{s});\n      tl.from("#{scene_id}-txt",{{opacity:0,y:30,duration:0.8,ease:"power3.out"}},{s+0.2});\n      tl.from("#{scene_id}-auth",{{opacity:0,duration:0.5}},{s+0.7});'
    elif sid == "timeline":
        js = f'tl.from("#{scene_id}-t",{{opacity:0,duration:0.5}},{s});'
        for i in range(len(data.get("events",[]))):
            js += f'\n      tl.from("#{scene_id}-r{i}",{{opacity:0,x:-30,duration:0.4}},{s+0.4+i*0.2});'
        return js
    elif sid == "countdown":
        return f'tl.from("#{scene_id}-lbl",{{opacity:0,duration:0.3}},{s});\n      tl.from("#{scene_id}-num",{{opacity:0,scale:2,duration:1.2,ease:"elastic.out(1,0.4)"}},{s+0.2});\n      tl.from("#{scene_id}-unit",{{opacity:0,duration:0.4}},{s+0.7});'
    elif sid == "split-image":
        return f'tl.from("#{scene_id}-img",{{y:-40,opacity:0,duration:0.7,ease:"power3.out"}},{s});\n      tl.from("#{scene_id}-hl",{{opacity:0,y:30,duration:0.6}},{s+0.4});\n      tl.from("#{scene_id}-bd",{{opacity:0,duration:0.5}},{s+0.7});'
    elif sid == "data-grid":
        js = f'tl.from("#{scene_id}-t",{{opacity:0,duration:0.4}},{s});'
        for i in range(len(data.get("cells",[]))):
            js += f'\n      tl.from("#{scene_id}-c{i}",{{opacity:0,scale:0.9,duration:0.5,ease:"back.out(1.5)"}},{s+0.3+i*0.15});'
        return js
    elif sid == "title-card":
        return f'tl.from("#{scene_id}-cat",{{opacity:0,duration:0.4}},{s});\n      tl.from("#{scene_id}-title",{{opacity:0,y:60,duration:0.9,ease:"power4.out"}},{s+0.2});\n      tl.from("#{scene_id}-div",{{opacity:0,scaleX:0,duration:0.5,ease:"power2.out"}},{s+0.6});\n      tl.from("#{scene_id}-date",{{opacity:0,duration:0.4}},{s+0.8});'
    return ""

def get_css() -> str:
    """Return CSS for default template set."""
    css_path = os.path.join(os.path.dirname(__file__), "styles.css")
    if os.path.exists(css_path):
        with open(css_path, "r", encoding="utf-8") as f:
            return f.read()
    return ""
