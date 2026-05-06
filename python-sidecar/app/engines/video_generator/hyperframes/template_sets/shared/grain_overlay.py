"""Grain noise texture overlay — SVG-based, no external file needed."""

_SVG_NOISE = "data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.90%22/%3E%3C/svg%3E"


def render_grain() -> str:
    """HTML div for grain overlay — place at end of scene container."""
    return f'<div class="grain-overlay" style="background-image: url(\'{_SVG_NOISE}\');"></div>'


def grain_css() -> str:
    """CSS for grain overlay."""
    return """
.grain-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  background-repeat: repeat;
  background-size: 200px 200px;
  mix-blend-mode: overlay;
}
"""
