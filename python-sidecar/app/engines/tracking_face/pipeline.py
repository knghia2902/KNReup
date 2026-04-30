"""
FaceCrop916 — main pipeline.

Usage
-----
    from face_crop_916 import FaceCrop916

    pipe = FaceCrop916(gpu_id=0)
    pipe.process("input.mp4", "output.mp4")

Or with custom settings:

    pipe = FaceCrop916(
        gpu_id=0,
        alpha=0.10,           # camera smoothing (lower = smoother)
        speaker_window=45,    # frames for lip activity window
        out_resolution=(1080, 1920),
        detect_every=3,       # run face detection every N frames (speed)
    )
    pipe.process("podcast.mp4", "podcast_916.mp4", progress=True)
"""
from __future__ import annotations

import os
import subprocess
import tempfile
from pathlib import Path
from typing import Callable

import cv2
import numpy as np

from .detector import FaceDetector
from .tracker import FaceTracker
from .speaker import LipMovementDetector
from .smoother import CameraSmoother, Cropper916


class FaceCrop916:
    """
    Converts any video to 9:16 by tracking the active speaker's face.

    Parameters
    ----------
    gpu_id : int
        CUDA device index for InsightFace.
    alpha : float
        Camera smoothing factor (0.05–0.20 recommended).
    dead_zone : float
        Fraction of frame where camera won't pan (reduces jitter).
    speaker_window : int
        Rolling window (frames) for lip-movement activity scoring.
    detect_every : int
        Run full face detection every N frames; interpolate in between.
        Higher = faster but may lose fast-moving faces.
    out_resolution : tuple[int, int]
        Output (width, height). Default: 1080×1920.
    head_room : float
        Fraction of crop height reserved above the face (vertical bias).
    fallback_center : bool
        If True, default to frame center when no face detected.
        If False, hold last known position.
    """

    def __init__(
        self,
        gpu_id: int = 0,
        alpha: float = 0.08,
        dead_zone: float = 0.03,
        speaker_window: int = 30,
        detect_every: int = 3,
        out_resolution: tuple[int, int] = (1080, 1920),
        head_room: float = 0.15,
        fallback_center: bool = True,
    ):
        self.gpu_id = gpu_id
        self.alpha = alpha
        self.dead_zone = dead_zone
        self.speaker_window = speaker_window
        self.detect_every = detect_every
        self.out_w, self.out_h = out_resolution
        self.head_room = head_room
        self.fallback_center = fallback_center

        # Lazy-init heavy models so import is fast
        self._detector: FaceDetector | None = None
        self._tracker: FaceTracker | None = None
        self._speaker: LipMovementDetector | None = None
        self._smoother: CameraSmoother | None = None
        self._cropper: Cropper916 | None = None

    def _init_models(self) -> None:
        self._detector = FaceDetector(gpu_id=self.gpu_id)
        self._tracker  = FaceTracker()
        self._speaker  = LipMovementDetector(window=self.speaker_window)
        self._smoother = CameraSmoother(alpha=self.alpha, dead_zone=self.dead_zone)
        self._cropper  = Cropper916(head_room=self.head_room)

    # ------------------------------------------------------------------
    # Stage 1: Analyze — extract tracking data without rendering
    # ------------------------------------------------------------------

    def analyze(
        self,
        input_path: str | os.PathLike,
        progress_callback: Callable[[int, int], None] | None = None,
    ) -> dict:
        """
        Chạy AI face tracking và trả về tracking data dict.
        KHÔNG ghi video — chỉ thu thập per-frame crop center data.

        Returns dict với keys: version, source, fps, frame_width, frame_height,
        crop_width, crop_height, settings, frames[], keyframes[].
        """
        self._init_models()
        input_path = Path(input_path)

        cap = cv2.VideoCapture(str(input_path))
        if not cap.isOpened():
            raise IOError(f"Cannot open video: {input_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fw = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        fh = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        crop_w, crop_h = self._cropper.compute_crop_size(fw, fh)

        default_cx = fw / 2
        default_cy = fh / 2

        frames_data = []
        frame_idx = 0
        tracked_faces: list[dict] = []
        scores: dict[int, float] = {}
        speaker_id: int | None = None

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % self.detect_every == 0:
                detections = self._detector.detect(frame)
                tracked_faces = self._tracker.update(detections)
                scores = self._speaker.update(frame, tracked_faces)
                self._speaker.cleanup({f["id"] for f in tracked_faces})
                speaker_id = self._speaker.best_speaker(scores)

            target_cx, target_cy = default_cx, default_cy
            if speaker_id is not None:
                speaker_face = next(
                    (f for f in tracked_faces if f["id"] == speaker_id), None
                )
                if speaker_face is not None:
                    target_cx, target_cy = self._cropper.target_center(
                        speaker_face["bbox"], fw, fh, crop_w, crop_h
                    )
                elif not self.fallback_center and self._smoother._cx is not None:
                    target_cx = self._smoother._cx
                    target_cy = self._smoother._cy

            smooth_cx, smooth_cy = self._smoother.update(target_cx, target_cy)
            smooth_cx, smooth_cy = self._cropper.clamp_center(
                smooth_cx, smooth_cy, fw, fh, crop_w, crop_h
            )

            frames_data.append({
                "idx": frame_idx,
                "cx": round(float(smooth_cx), 2),
                "cy": round(float(smooth_cy), 2),
                "speaker_id": speaker_id,
            })

            frame_idx += 1
            if progress_callback:
                progress_callback(frame_idx, total)

        cap.release()

        return {
            "version": 1,
            "source": str(input_path),
            "fps": fps,
            "frame_width": fw,
            "frame_height": fh,
            "crop_width": crop_w,
            "crop_height": crop_h,
            "settings": {
                "alpha": self.alpha,
                "dead_zone": self.dead_zone,
                "detect_every": self.detect_every,
                "fallback_center": self.fallback_center,
                "head_room": self.head_room,
            },
            "frames": frames_data,
            "keyframes": [],
        }

    # ------------------------------------------------------------------
    # Stage 2: Render — crop video from pre-computed tracking data
    # ------------------------------------------------------------------

    def render_from_tracking(
        self,
        input_path: str | os.PathLike,
        output_path: str | os.PathLike,
        tracking_data: dict,
        out_resolution: tuple[int, int] | None = None,
        encode_crf: int = 18,
        encode_preset: str = "fast",
        progress_callback: Callable[[int, int], None] | None = None,
    ) -> None:
        """
        Render video 9:16 từ tracking data đã có.
        Không cần chạy lại AI detection — chỉ đọc cx/cy per-frame và crop.

        Parameters
        ----------
        tracking_data : dict từ analyze() hoặc load từ JSON (đã apply keyframes)
        out_resolution : override output resolution, None = dùng self.out_w/out_h
        """
        input_path = Path(input_path)
        output_path = Path(output_path)

        cap = cv2.VideoCapture(str(input_path))
        if not cap.isOpened():
            raise IOError(f"Cannot open video: {input_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fw = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        fh = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        crop_w = tracking_data["crop_width"]
        crop_h = tracking_data["crop_height"]
        frames = tracking_data["frames"]

        out_w, out_h = out_resolution or (self.out_w, self.out_h)

        # Cropper chỉ cần stateless methods — không cần detector/tracker/speaker
        if self._cropper is None:
            self._cropper = Cropper916(head_room=self.head_room)

        tmp_video = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
        tmp_video.close()

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(tmp_video.name, fourcc, fps, (out_w, out_h))

        frame_idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Lookup tracking data cho frame hiện tại
            if frame_idx < len(frames):
                cx = frames[frame_idx]["cx"]
                cy = frames[frame_idx]["cy"]
            else:
                # Nếu video dài hơn tracking data — giữ vị trí cuối
                cx = frames[-1]["cx"] if frames else fw / 2
                cy = frames[-1]["cy"] if frames else fh / 2

            cx, cy = self._cropper.clamp_center(cx, cy, fw, fh, crop_w, crop_h)

            out_frame = self._cropper.extract(
                frame, cx, cy, crop_w, crop_h, out_w, out_h
            )
            writer.write(out_frame)

            frame_idx += 1
            if progress_callback:
                progress_callback(frame_idx, total)

        cap.release()
        writer.release()

        self._mux_audio(
            str(input_path), tmp_video.name, str(output_path),
            crf=encode_crf, preset=encode_preset,
        )
        os.unlink(tmp_video.name)

    # ------------------------------------------------------------------
    # Legacy: full process (backward compatible)
    # ------------------------------------------------------------------

    def process(
        self,
        input_path: str | os.PathLike,
        output_path: str | os.PathLike,
        progress: bool = True,
        progress_callback: Callable[[int, int], None] | None = None,
        encode_crf: int = 18,
        encode_preset: str = "fast",
    ) -> None:
        """
        Process a video file and write 9:16 output.

        Parameters
        ----------
        input_path : source video (any format ffmpeg supports)
        output_path : destination .mp4
        progress : print tqdm progress bar
        progress_callback : optional fn(frame_idx, total_frames)
        encode_crf : H.264 CRF (18=high quality, 28=smaller file)
        encode_preset : ffmpeg preset (ultrafast/fast/medium/slow)
        """
        self._init_models()
        input_path  = Path(input_path)
        output_path = Path(output_path)

        cap = cv2.VideoCapture(str(input_path))
        if not cap.isOpened():
            raise IOError(f"Cannot open video: {input_path}")

        fps        = cap.get(cv2.CAP_PROP_FPS)
        total      = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fw         = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        fh         = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        crop_w, crop_h = self._cropper.compute_crop_size(fw, fh)

        # Write raw video to temp file, then mux audio with ffmpeg
        tmp_video = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
        tmp_video.close()

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(
            tmp_video.name, fourcc, fps, (self.out_w, self.out_h)
        )

        # Progress bar
        pbar = None
        if progress:
            try:
                from tqdm import tqdm
                pbar = tqdm(total=total, unit="frame", desc="Processing")
            except ImportError:
                pass

        frame_idx = 0
        tracked_faces: list[dict] = []
        scores: dict[int, float] = {}
        speaker_id: int | None = None

        # Fallback center
        default_cx = fw / 2
        default_cy = fh / 2

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # --- Face detection (every N frames) ---
            if frame_idx % self.detect_every == 0:
                detections = self._detector.detect(frame)
                tracked_faces = self._tracker.update(detections)
                scores = self._speaker.update(frame, tracked_faces)
                self._speaker.cleanup({f["id"] for f in tracked_faces})
                speaker_id = self._speaker.best_speaker(scores)

            # --- Choose target center ---
            target_cx, target_cy = default_cx, default_cy

            if speaker_id is not None:
                speaker_face = next(
                    (f for f in tracked_faces if f["id"] == speaker_id), None
                )
                if speaker_face is not None:
                    target_cx, target_cy = self._cropper.target_center(
                        speaker_face["bbox"], fw, fh, crop_w, crop_h
                    )
                elif not self.fallback_center and self._smoother._cx is not None:
                    # Hold last position
                    target_cx = self._smoother._cx
                    target_cy = self._smoother._cy

            # --- Smooth camera ---
            smooth_cx, smooth_cy = self._smoother.update(target_cx, target_cy)
            smooth_cx, smooth_cy = self._cropper.clamp_center(
                smooth_cx, smooth_cy, fw, fh, crop_w, crop_h
            )

            # --- Extract & write frame ---
            out_frame = self._cropper.extract(
                frame, smooth_cx, smooth_cy,
                crop_w, crop_h,
                self.out_w, self.out_h,
            )
            writer.write(out_frame)

            frame_idx += 1
            if pbar:
                pbar.update(1)
            if progress_callback:
                progress_callback(frame_idx, total)

        cap.release()
        writer.release()
        if pbar:
            pbar.close()

        # --- Mux audio ---
        self._mux_audio(
            str(input_path), tmp_video.name, str(output_path),
            crf=encode_crf, preset=encode_preset
        )
        os.unlink(tmp_video.name)
        print(f"\n✅ Done → {output_path}")

    # ------------------------------------------------------------------
    # Audio muxing via ffmpeg
    # ------------------------------------------------------------------

    @staticmethod
    def _mux_audio(
        original: str,
        video_only: str,
        output: str,
        crf: int = 18,
        preset: str = "fast",
    ) -> None:
        """Re-encode video with H.264 and mux original audio."""
        cmd = [
            "ffmpeg", "-y",
            "-i", video_only,
            "-i", original,
            "-c:v", "libx264",
            "-crf", str(crf),
            "-preset", preset,
            "-map", "0:v:0",
            "-map", "1:a:0?",   # ? = optional, skip if no audio
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            output,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(
                f"ffmpeg mux failed:\n{result.stderr}"
            )

    # ------------------------------------------------------------------
    # Convenience: process a list of files
    # ------------------------------------------------------------------

    def process_batch(
        self,
        input_dir: str | os.PathLike,
        output_dir: str | os.PathLike,
        glob: str = "*.mp4",
        **kwargs,
    ) -> None:
        """
        Process all matching files in input_dir → output_dir.

        Example
        -------
            pipe.process_batch("./raw", "./vertical", glob="*.mp4")
        """
        import glob as _glob

        input_dir  = Path(input_dir)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        files = sorted(input_dir.glob(glob))
        print(f"Found {len(files)} file(s) to process.")
        for f in files:
            out = output_dir / f.name
            print(f"\n▶ {f.name}")
            self.process(f, out, **kwargs)
