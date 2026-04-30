"""
Tracking data I/O — save/load JSON + keyframe interpolation.

File naming convention: A.mp4 → A_tracking.json (cạnh video gốc).
"""
from __future__ import annotations

import json
from pathlib import Path


def tracking_path_for(video_path: str | Path) -> Path:
    """Derive tracking JSON path from video path: A.mp4 → A_tracking.json."""
    p = Path(video_path)
    return p.with_name(f"{p.stem}_tracking.json")


def save_tracking(data: dict, output_path: str | Path) -> str:
    """Serialize tracking data to JSON file. Returns the output path."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    return str(output_path)


def load_tracking(json_path: str | Path) -> dict:
    """Load tracking data from JSON file."""
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)


def apply_keyframes(tracking_data: dict, keyframes: list[dict]) -> dict:
    """
    Apply user keyframe edits to tracking data with linear interpolation.

    Each keyframe: {"frame_idx": int, "cx": float}
    (Chỉ horizontal pan — D-08: không zoom/rotation)

    Interpolation rules:
    - Frames trước keyframe đầu tiên: giữ nguyên AI tracking
    - Giữa 2 keyframes: linear interpolation trên cx
    - Frames sau keyframe cuối: giữ offset cuối

    Returns: new tracking_data dict với frames[].cx đã override.
    """
    if not keyframes:
        return tracking_data

    # Sort keyframes by frame_idx
    kfs = sorted(keyframes, key=lambda k: k["frame_idx"])
    frames = tracking_data["frames"]

    # Apply interpolation
    new_frames = []
    for frame in frames:
        idx = frame["idx"]
        new_frame = {**frame}

        if any(kf["frame_idx"] == idx for kf in kfs):
            # Exact keyframe hit
            new_frame["cx"] = next(
                kf["cx"] for kf in kfs if kf["frame_idx"] == idx
            )
        elif idx > kfs[-1]["frame_idx"]:
            # After last keyframe — hold last keyframe cx
            new_frame["cx"] = kfs[-1]["cx"]
        elif idx < kfs[0]["frame_idx"]:
            # Before first keyframe — keep AI tracking (no change)
            pass
        else:
            # Between two keyframes — linear interpolation
            prev_kf = None
            next_kf = None
            for kf in kfs:
                if kf["frame_idx"] <= idx:
                    prev_kf = kf
                if kf["frame_idx"] > idx and next_kf is None:
                    next_kf = kf

            if prev_kf and next_kf:
                t = (idx - prev_kf["frame_idx"]) / (
                    next_kf["frame_idx"] - prev_kf["frame_idx"]
                )
                new_frame["cx"] = prev_kf["cx"] + t * (
                    next_kf["cx"] - prev_kf["cx"]
                )

        new_frames.append(new_frame)

    result = {**tracking_data, "frames": new_frames, "keyframes": kfs}
    return result
