import os
import re

def render_scene_html(scene_id: str, sid: str, data: dict, theme: dict) -> str:
    """Render the inner HTML for V2 News Visual System scenes."""
    
    def escape(s):
        if not s: return ""
        return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
    
    html = ""
    
    if sid == "hook":
        headline = escape(data.get("headline", ""))
        subhead = escape(data.get("subhead", ""))
        
        bg_html = f'<div class="bg gradient-news-dark"></div>'
        if data.get("bgSrc"):
            bg_html = f'<div class="bg kb-zoom-in" style="background-image: url(\'{data["bgSrc"]}\')"></div>'
            
        overlay_html = '<div class="overlay" style="opacity: 0.55"></div>'
        
        html = f'''{bg_html}
        {overlay_html}
        <div id="{scene_id}-hook-layout" class="layout-hook" style="position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 200px 80px 300px; text-align: center;">
            <div id="{scene_id}-headline" class="hook-headline shimmer-sweep-target">{headline}</div>
            <div id="{scene_id}-subhead" class="hook-subhead">{subhead}</div>
        </div>'''
        
    elif sid == "comparison":
        l_color = data.get("left", {}).get("color", "cyan")
        r_color = data.get("right", {}).get("color", "purple")
        r_winner = data.get("right", {}).get("winner", False)
        
        l_label = escape(data.get("left", {}).get("label", ""))
        l_value = escape(data.get("left", {}).get("value", ""))
        r_label = escape(data.get("right", {}).get("label", ""))
        r_value = escape(data.get("right", {}).get("value", ""))
        
        w_class = " card-winner" if r_winner else ""
        w_badge = '<div class="cmp-winner-badge">WINNER</div>' if r_winner else ""
        
        html = f'''<div id="{scene_id}-comp-layout" class="layout-comparison">
          <div id="{scene_id}-left" class="cmp-card cmp-left color-{l_color}">
            <div class="cmp-label">{l_label}</div>
            <div class="cmp-value">{l_value}</div>
          </div>
          <div id="{scene_id}-vs" class="cmp-vs">VS</div>
          <div id="{scene_id}-right" class="cmp-card cmp-right color-{r_color}{w_class}">
            <div class="cmp-label">{r_label}</div>
            <div class="cmp-value">{r_value}</div>
            {w_badge}
          </div>
        </div>'''
        
    elif sid == "stat-hero":
        val = escape(data.get("value", ""))
        lbl = escape(data.get("label", ""))
        ctx = escape(data.get("context", ""))
        
        ctx_html = f'<div id="{scene_id}-ctx" class="stat-context">{ctx}</div>' if ctx else ""
        
        html = f'''<div id="{scene_id}-stat-layout" class="layout-stat-hero">
          <div id="{scene_id}-val" class="stat-value shimmer-sweep-target">{val}</div>
          <div id="{scene_id}-lbl" class="stat-label">{lbl}</div>
          {ctx_html}
        </div>'''
        
    elif sid == "feature-list":
        title = escape(data.get("title", ""))
        bullets = ""
        for i, b in enumerate(data.get("bullets", [])):
            bullets += f'''
            <div id="{scene_id}-b{i}" class="feat-bullet feat-bullet-{i}">
              <div class="feat-dot"></div>
              <div class="feat-text">{escape(b)}</div>
            </div>'''
            
        html = f'''<div id="{scene_id}-feat-layout" class="layout-feature-list">
          <div id="{scene_id}-card" class="feat-card">
            <div class="feat-title">{title}</div>
            <div id="{scene_id}-rule" class="feat-rule"></div>
            <div class="feat-bullets">
              {bullets}
            </div>
          </div>
        </div>'''
        
    elif sid == "callout":
        tag = escape(data.get("tag", ""))
        statement = escape(data.get("statement", ""))
        
        tag_html = f'<div class="callout-tag">{tag}</div>' if tag else ""
        
        html = f'''<div id="{scene_id}-callout-layout" class="layout-callout">
          <div id="{scene_id}-card" class="callout-card">
            {tag_html}
            <div class="callout-statement">{statement}</div>
          </div>
        </div>'''
        
    elif sid == "outro":
        cta = escape(data.get("ctaTop", ""))
        ch = escape(data.get("channelName", ""))
        src = escape(data.get("source", ""))
        
        tt_card = f'''<div id="{scene_id}-tt-card" class="tt-card">
          <img class="tt-avatar" src="assets/avatar.png" alt="KNReup" crossorigin="anonymous" />
          <div class="tt-profile-info">
            <div class="tt-display-name">KNReup News</div>
            <div class="tt-handle">@knreup</div>
            <div class="tt-followers">1.2M followers</div>
          </div>
          <div id="{scene_id}-tt-follow-btn" class="tt-follow-btn">
            <span id="{scene_id}-tt-btn-follow" class="tt-btn-text">Follow</span>
            <span id="{scene_id}-tt-btn-following" class="tt-btn-text tt-btn-text-following">
              <span>Following</span>
              <span class="tt-check-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
            </span>
          </div>
        </div>'''
        
        html = f'''<div id="{scene_id}-outro-layout" class="layout-outro">
          <div id="{scene_id}-cta" class="out-cta-top">{cta}</div>
          <div id="{scene_id}-ch" class="out-channel">{ch}</div>
          <div id="{scene_id}-ul" class="out-underline"></div>
          <div id="{scene_id}-src" class="out-source">Nguồn: {src}</div>
        </div>
        {tt_card}'''
    elif sid == "quote":
        text = escape(data.get("text", ""))
        author = escape(data.get("author", ""))
        
        html = f'''<div id="{scene_id}-quote-layout" class="layout-quote">
          <div id="{scene_id}-mark" class="quote-mark">"</div>
          <div id="{scene_id}-txt" class="quote-text">{text}</div>
          <div id="{scene_id}-auth" class="quote-author">{author}</div>
        </div>'''
        
    elif sid == "timeline":
        title = escape(data.get("title", ""))
        rows = ""
        for i, ev in enumerate(data.get("events", [])):
            yr = escape(ev.get("year", ""))
            evt = escape(ev.get("event", ""))
            rows += f'''
            <div id="{scene_id}-r{i}" class="tl-row">
              <div class="tl-dot"></div>
              <div class="tl-year">{yr}</div>
              <div class="tl-event">{evt}</div>
            </div>'''
            if i < len(data.get("events", [])) - 1:
                rows += f'<div class="tl-line"></div>'
        
        html = f'''<div id="{scene_id}-tl-layout" class="layout-timeline">
          <div id="{scene_id}-t" class="tl-title">{title}</div>
          <div class="tl-track">{rows}
          </div>
        </div>'''
        
    elif sid == "countdown":
        label = escape(data.get("label", ""))
        number = escape(data.get("number", ""))
        unit = escape(data.get("unit", ""))
        
        html = f'''<div id="{scene_id}-cd-layout" class="layout-countdown">
          <div id="{scene_id}-lbl" class="cd-label">{label}</div>
          <div id="{scene_id}-num" class="cd-number">{number}</div>
          <div id="{scene_id}-unit" class="cd-unit">{unit}</div>
        </div>'''

    elif sid == "data-grid":
        title = escape(data.get("title", ""))
        cells = ""
        for i, c in enumerate(data.get("cells", [])):
            val = escape(c.get("value", ""))
            lbl = escape(c.get("label", ""))
            cells += f'''
              <div id="{scene_id}-c{i}" class="dg-cell">
                <div class="dg-cell-value">{val}</div>
                <div class="dg-cell-label">{lbl}</div>
              </div>'''
        
        html = f'''<div id="{scene_id}-dg-layout" class="layout-data-grid">
          <div id="{scene_id}-t" class="dg-title">{title}</div>
          <div class="dg-grid">{cells}
          </div>
        </div>'''

    elif sid == "title-card":
        category = escape(data.get("category", ""))
        title = escape(data.get("title", ""))
        date = escape(data.get("date", ""))
        
        html = f'''<div id="{scene_id}-tc-layout" class="layout-title-card">
          <div id="{scene_id}-cat" class="tc-category">{category}</div>
          <div id="{scene_id}-title" class="tc-title">{title}</div>
          <div id="{scene_id}-div" class="tc-divider"></div>
          <div id="{scene_id}-date" class="tc-date">{date}</div>
        </div>'''

    elif sid == "split-image":
        headline = escape(data.get("headline", ""))
        body = escape(data.get("body", ""))
        
        html = f'''<div id="{scene_id}-si-layout" class="layout-split-image">
          <div id="{scene_id}-img" class="split-img-zone"></div>
          <div class="split-text-zone">
            <div id="{scene_id}-hl" class="split-headline">{headline}</div>
            <div id="{scene_id}-bd" class="split-body">{body}</div>
          </div>
        </div>'''

    else:
        # Fallback — render as callout style
        text = escape(str(data.get("statement", data.get("text", data.get("headline", sid)))))
        html = f'''<div class="layout-callout">
          <div class="callout-card" style="opacity:1;">
            <div class="callout-statement">{text}</div>
          </div>
        </div>'''
    
    return html

def get_shell_html() -> str:
    """Return the persistent shell elements for the V2 News layout."""
    return '''
    <!-- Shell: persistent brand elements (no data-start -> always visible) -->
    <div class="shell-bg"></div>

    <div class="brand-shell-header">
      <div class="brand-icon">&gt;_</div>
      <div class="brand-text">
        <div class="brand-name">KNReup News</div>
        <div class="brand-tag">TIN CÔNG NGHỆ</div>
      </div>
    </div>

    <div class="brand-shell-handle">
      <span class="handle-music">&#9835;</span>
      <span class="handle-text">@knreup</span>
    </div>

    <div class="brand-shell-keyword">
      <span>vnexpress.net</span>
    </div>
    
    <!-- Grain overlay -->
    <div class="grain-overlay" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.35%22/%3E%3C/svg%3E');"></div>
    '''

def render_scene_animation(scene_id: str, sid: str, data: dict, start: float) -> str:
    """Return GSAP animation string for the given scene."""
    s = start
    js = ""
    
    if sid == "hook":
        js += f'tl.fromTo("#{scene_id}-headline", {{ scale: 0.5, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.6 }}, {s + 0.15});\n'
        js += f'tl.fromTo("#{scene_id}-subhead", {{ y: 60, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.5 }}, {s + 0.55});\n'
    elif sid == "comparison":
        js += f'tl.fromTo("#{scene_id}-left", {{ x: -80, opacity: 0 }}, {{ x: 0, opacity: 1, duration: 0.5 }}, {s + 0.15});\n'
        js += f'tl.fromTo("#{scene_id}-vs", {{ scale: 0.5, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.35 }}, {s + 0.45});\n'
        js += f'tl.fromTo("#{scene_id}-right", {{ x: 80, opacity: 0 }}, {{ x: 0, opacity: 1, duration: 0.5 }}, {s + 0.6});\n'
    elif sid == "stat-hero":
        js += f'tl.fromTo("#{scene_id}-val", {{ scale: 0.4, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.6 }}, {s + 0.15});\n'
        js += f'tl.fromTo("#{scene_id}-lbl", {{ y: 40, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.45 }}, {s + 0.55});\n'
        if data.get("context"):
            js += f'tl.fromTo("#{scene_id}-ctx", {{ y: 30, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.4 }}, {s + 0.85});\n'
    elif sid == "feature-list":
        js += f'tl.fromTo("#{scene_id}-card", {{ y: 60, scale: 0.95, opacity: 0 }}, {{ y: 0, scale: 1, opacity: 1, duration: 0.5 }}, {s + 0.1});\n'
        js += f'tl.fromTo("#{scene_id}-rule", {{ scaleX: 0, opacity: 1 }}, {{ scaleX: 1, opacity: 1, duration: 0.4 }}, {s + 0.45});\n'
        for i in range(len(data.get("bullets", []))):
            js += f'tl.fromTo("#{scene_id}-b{i}", {{ x: -40, opacity: 0 }}, {{ x: 0, opacity: 1, duration: 0.4 }}, {s + 0.6 + i * 0.15});\n'
    elif sid == "callout":
        js += f'tl.fromTo("#{scene_id}-card", {{ y: 50, scale: 0.92, opacity: 0 }}, {{ y: 0, scale: 1, opacity: 1, duration: 0.55 }}, {s + 0.2});\n'
    elif sid == "outro":
        js += f'tl.fromTo("#{scene_id}-cta", {{ opacity: 0, y: -30 }}, {{ opacity: 1, y: 0, duration: 0.45 }}, {s + 0.2});\n'
        js += f'tl.fromTo("#{scene_id}-ch", {{ scale: 0.6, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.55 }}, {s + 0.55});\n'
        js += f'tl.fromTo("#{scene_id}-ul", {{ width: 0 }}, {{ width: "600px", duration: 0.5 }}, {s + 0.9});\n'
        js += f'tl.fromTo("#{scene_id}-src", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.4 }}, {s + 1.3});\n'
        
        # TikTok card sequence
        ttBase = s + 1.6
        js += f'tl.fromTo("#{scene_id}-tt-card", {{ opacity: 0, y: 300, xPercent: -50 }}, {{ opacity: 1, y: 0, xPercent: -50, duration: 0.5 }}, {ttBase});\n'
        js += f'tl.to("#{scene_id}-tt-follow-btn", {{ scale: 0.92, duration: 0.15 }}, {ttBase + 0.9});\n'
        js += f'tl.to("#{scene_id}-tt-follow-btn", {{ scale: 1, duration: 0.4 }}, {ttBase + 1.05});\n'
        js += f'tl.to("#{scene_id}-tt-btn-follow", {{ opacity: 0, duration: 0.08 }}, {ttBase + 1.05});\n'
        js += f'tl.to("#{scene_id}-tt-btn-following", {{ opacity: 1, duration: 0.08 }}, {ttBase + 1.08});\n'
    elif sid == "quote":
        js += f'tl.fromTo("#{scene_id}-mark", {{ scale: 0.3, opacity: 0 }}, {{ scale: 1, opacity: 0.2, duration: 0.5 }}, {s + 0.1});\n'
        js += f'tl.fromTo("#{scene_id}-txt", {{ y: 40, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.7 }}, {s + 0.3});\n'
        js += f'tl.fromTo("#{scene_id}-auth", {{ y: 20, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.5 }}, {s + 0.8});\n'
    elif sid == "timeline":
        js += f'tl.fromTo("#{scene_id}-t", {{ y: -30, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.5 }}, {s + 0.1});\n'
        for i in range(len(data.get("events", []))):
            js += f'tl.fromTo("#{scene_id}-r{i}", {{ x: -40, opacity: 0 }}, {{ x: 0, opacity: 1, duration: 0.4 }}, {s + 0.4 + i * 0.2});\n'
    elif sid == "countdown":
        js += f'tl.fromTo("#{scene_id}-lbl", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.4 }}, {s + 0.1});\n'
        js += f'tl.fromTo("#{scene_id}-num", {{ scale: 2.5, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 1.0, ease: "elastic.out(1,0.4)" }}, {s + 0.3});\n'
        js += f'tl.fromTo("#{scene_id}-unit", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.4 }}, {s + 0.8});\n'
    elif sid == "data-grid":
        js += f'tl.fromTo("#{scene_id}-t", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.4 }}, {s + 0.1});\n'
        for i in range(len(data.get("cells", []))):
            js += f'tl.fromTo("#{scene_id}-c{i}", {{ scale: 0.85, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.5)" }}, {s + 0.3 + i * 0.15});\n'
    elif sid == "title-card":
        js += f'tl.fromTo("#{scene_id}-cat", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.4 }}, {s + 0.1});\n'
        js += f'tl.fromTo("#{scene_id}-title", {{ y: 60, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.8, ease: "power4.out" }}, {s + 0.3});\n'
        js += f'tl.fromTo("#{scene_id}-div", {{ scaleX: 0, opacity: 0 }}, {{ scaleX: 1, opacity: 1, duration: 0.5 }}, {s + 0.7});\n'
        js += f'tl.fromTo("#{scene_id}-date", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.4 }}, {s + 1.0});\n'
    elif sid == "split-image":
        js += f'tl.fromTo("#{scene_id}-img", {{ y: -50, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.7 }}, {s + 0.1});\n'
        js += f'tl.fromTo("#{scene_id}-hl", {{ y: 30, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.6 }}, {s + 0.5});\n'
        js += f'tl.fromTo("#{scene_id}-bd", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.5 }}, {s + 0.8});\n'
        
    return js

def get_css() -> str:
    """Return the CSS string for V2 News Visual System."""
    import os
    css_path = os.path.join(os.path.dirname(__file__), "v2_visual_styles.css")
    if os.path.exists(css_path):
        with open(css_path, "r", encoding="utf-8") as f:
            return f.read()
    return ""
