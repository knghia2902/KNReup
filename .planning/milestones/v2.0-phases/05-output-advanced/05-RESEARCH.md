# Phase 5: Output Advanced - Technical Research

## Architecture Overview
Research on integrating FFmpeg advanced video & audio features (Blur, Crop, Watermark, BGM Ducking) into the existing `FFmpegOutputBuilder` class in `app/engines/output.py`, and extending `PipelineConfig` in `app/pipeline_runner.py`.

## FFmpeg Filter Implementation Strategies
1. **Blur (Subtitles/Region)**
   - Instead of complex boxblur + overlay, use the `delogo` filter which natively takes x, y, w, h parameters: `[0:v]delogo=x=X:y=Y:w=W:h=H[v1]`.
2. **Smart Crop (16:9 to 9:16)**
   - Use the `crop` filter: `[v1]crop=ih*9/16:ih[v2]` (forces 9:16 ratio based on height).
   - *Note*: If cropping is applied BEFORE the ASS filter, the video dimensions change. The `generate_ass_file` logic in `FFmpegOutputBuilder` must compute the ASS `PlayResX` and `PlayResY` based on the *cropped* dimensions.
3. **Watermark / Text Logo**
   - For Image Logo: Add as additional input `-i watermark.png`. Scale and apply opacity: `[X:v]format=rgba,colorchannelmixer=aa=OPACITY[wm]`, then `[v3][wm]overlay=X:Y[vout]`.
   - For Text Watermark: Use `drawtext` filter: `[v3]drawtext=text='TEXT':fontcolor=white@OPACITY:fontsize=SIZE:x=X:y=Y:shadowcolor=black:shadowx=2:shadowy=2[vout]`.
4. **BGM & Ducking**
   - Add BGM file as input with looping: `-stream_loop -1 -i bgm.mp3` (if audio is shorter than video).
   - Ducking logic (lower BGM when TTS speaks):
     ```
     [1:a]volume=1.0[dub];
     [0:a]volume=ORIG_VOL[orig];
     [2:a]volume=BGM_VOL[bgm];
     [bgm][dub]sidechaincompress=threshold=0.1:ratio=DUCKING_RATIO:attack=5:release=50[bgm_ducked];
     [orig][dub][bgm_ducked]amix=inputs=3:duration=first[aout]
     ```

## Codebase Changes Required
1. **`app/pipeline_runner.py`**:
   - Update `PipelineConfig` to accept new output parameters: `watermark_text` (or img), `watermark_x`, `watermark_y`, `watermark_opacity`, `blur_enabled`, `blur_x`, `blur_y`, `blur_w`, `blur_h`, `crop_enabled`, `bgm_enabled`, `bgm_file`, `bgm_volume`, `ducking_strength`.
2. **`app/engines/output.py`**:
   - `FFmpegOutputBuilder`: Parse the new config parameters.
   - Refactor the hardcoded `filter_complex_parts` chaining mechanism into a clean input-output stream variable system (e.g., tracking current video stream tag `[vCurrent]` and `[aCurrent]`) to avoid tag collision.
   - Adjust `_ass_file` generator to use Post-Crop dimensions if `crop_enabled=True`.

## Validation Architecture
- **Unit Testing**: Validate `FFmpegOutputBuilder.build()` without running subprocess. Mock `subprocess.Popen` and assert that `cmd` variable has correct `[bgm][dub]sidechaincompress` syntax and correct tag wiring.
- **Integration**: Start pipeline with a sample video + `bgm_file`. The resultant `output.mp4` must contain visually confirmed blur, and ducked audio.
