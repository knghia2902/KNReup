---
phase: 05
wave: 1
depends_on: []
files_modified:
  - python-sidecar/app/pipeline_runner.py
  - python-sidecar/app/engines/output.py
autonomous: false
---

# Phase 05: Backend — FFmpeg Output Advanced

<objective>
Update `PipelineConfig` and `FFmpegOutputBuilder` to dynamically apply `delogo` (Blur), `crop`, `drawtext`/`overlay` (Watermark), and `sidechaincompress` (BGM Ducking) using FFmpeg `-filter_complex`.
</objective>

<requirements>
- M2-07
- M2-08
- M2-09
- M2-10
</requirements>

<must_haves>
- Clean FFmpeg filter graph generation avoiding stream collision
- PipelineConfig explicitly defines properties for crop, blur, watermark, bgm
</must_haves>

## Tasks

<task>
<id>05-01-01</id>
<title>Extend PipelineConfig Models</title>
<read_first>
- python-sidecar/app/pipeline_runner.py
- .planning/phases/05-output-advanced/05-RESEARCH.md
</read_first>
<action>
Update `PipelineConfig` class in `python-sidecar/app/pipeline_runner.py` to include:
- `watermark_enabled: bool = False`
- `watermark_text: str = ""`
- `watermark_x: int = 10`
- `watermark_y: int = 10`
- `watermark_opacity: float = 1.0`
- `blur_enabled: bool = False`
- `blur_x: int = 0`
- `blur_y: int = 0`
- `blur_w: int = 0`
- `blur_h: int = 0`
- `crop_enabled: bool = False`
- `bgm_enabled: bool = False`
- `bgm_file: str = ""`
- `bgm_volume: float = 0.5`
- `ducking_strength: float = 0.2` (Default sidechaincompress ratio)
Update `__init__` signature and assignments accordingly.
</action>
<acceptance_criteria>
- `PipelineConfig` has `watermark_enabled` to `ducking_strength` attributes initialized
- `PipelineConfig` can be instantiated without errors with default values
</acceptance_criteria>
</task>

<task>
<id>05-01-02</id>
<title>Implement Complex FFmpeg Filter in OutputBuilder</title>
<read_first>
- python-sidecar/app/engines/output.py
- .planning/phases/05-output-advanced/05-RESEARCH.md
</read_first>
<action>
Rewrite `build(...)` in `FFmpegOutputBuilder` to construct `-filter_complex` modularly.
1. Define an initial video stream `[0:v]` mapped to a variable `current_v = "0:v"`.
2. **Crop**: If `config.crop_enabled`, add `[current_v]crop=ih*9/16:ih[vcrop]`, update `current_v = "vcrop"`.
3. **Blur**: If `config.blur_enabled`, add `[{current_v}]delogo=x={config.blur_x}:y={config.blur_y}:w={config.blur_w}:h={config.blur_h}[vblur]`, update `current_v = "vblur"`.
4. **Watermark**: If `config.watermark_enabled` and text exists, use `drawtext` on `[{current_v}]` -> `[vwm]`. Update `current_v = "vwm"`.
5. **Subtitles**: Apply `ass` to `{current_v}`, producing `[vout]`. Let `current_v = "vout"`.
6. **BGM & Ducking**: If `config.bgm_enabled` and file is valid:
   - add `-stream_loop -1 -i bgm_file`
   - add `[bgm_idx:a]volume={bgm_vol}[bgm]`
   - and `[bgm][dub]sidechaincompress=...[bgm_ducked]`
   - and `amix=inputs=3[aout]`
Update `generate_ass_file` behavior to detect if crop was enabled, setting `PlayResX` to `W*9/16`.
Ensure `map_args` maps to the final `[{current_v}]` and `[aout]`.
</action>
<acceptance_criteria>
- `build` properly chains filters step-by-step
- Running `build` logic outputs a command with `delogo`, `drawtext`, `sidechaincompress`, and `crop` if enabled
- `map` correctly selects the final video and audio stream outputs
</acceptance_criteria>
</task>
