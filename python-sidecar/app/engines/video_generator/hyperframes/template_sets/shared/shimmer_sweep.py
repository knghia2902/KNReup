"""Shimmer sweep animation — applies to elements with class shimmer-sweep-target."""

def shimmer_css(color: str = "#ffffff", delay_sec: float = 0.5) -> str:
    """CSS keyframes for shimmer sweep effect. Apply class 'shimmer-sweep-target' to elements."""
    return f"""
@keyframes shimmerSweep {{
  0% {{ mask-position: -200% center; -webkit-mask-position: -200% center; }}
  100% {{ mask-position: 200% center; -webkit-mask-position: 200% center; }}
}}
.shimmer-sweep-target {{
  position: relative;
}}
.shimmer-sweep-target::after {{
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    {color}22 40%,
    {color}44 50%,
    {color}22 60%,
    transparent 100%
  );
  mask-image: linear-gradient(
    90deg,
    transparent 0%,
    black 40%,
    black 60%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    90deg,
    transparent 0%,
    black 40%,
    black 60%,
    transparent 100%
  );
  mask-size: 200% 100%;
  -webkit-mask-size: 200% 100%;
  animation: shimmerSweep 2s ease-in-out {delay_sec}s infinite;
  pointer-events: none;
  z-index: 1;
}}
"""
