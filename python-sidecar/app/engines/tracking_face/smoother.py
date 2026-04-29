"""
Camera position smoothing and 9:16 crop geometry.

Smoothing strategy
------------------
Exponential Moving Average (EMA) on the crop center position.
Low alpha = sluggish but very smooth (good for talking-head).
High alpha = responsive but jittery.

We also implement a "dead zone" — the camera only moves when the
target drifts beyond a threshold, reducing unnecessary pan on
minor head movements.
"""
from __future__ import annotations

import numpy as np


class CameraSmoother:
    """
    Smooths crop-center position with EMA + dead zone.

    Parameters
    ----------
    alpha : float
        EMA coefficient (0 < alpha < 1).
        0.05 → very smooth / slow follow
        0.15 → balanced
        0.30 → snappy
    dead_zone : float
        Fraction of frame width/height within which camera won't move.
    """

    def __init__(self, alpha: float = 0.08, dead_zone: float = 0.04):
        self.alpha = alpha
        self.dead_zone = dead_zone
        self._cx: float | None = None
        self._cy: float | None = None

    def update(self, target_cx: float, target_cy: float) -> tuple[float, float]:
        if self._cx is None:
            self._cx, self._cy = target_cx, target_cy
            return self._cx, self._cy

        dx = target_cx - self._cx
        dy = target_cy - self._cy

        # Dead zone: don't move if target is very close
        # (scaled by a nominal 100px — caller should interpret in pixels)
        dz = self.dead_zone * 100
        if abs(dx) < dz:
            dx = 0
        if abs(dy) < dz:
            dy = 0

        self._cx += self.alpha * dx
        self._cy += self.alpha * dy
        return self._cx, self._cy

    def reset(self) -> None:
        self._cx = self._cy = None


class Cropper916:
    """
    Computes 9:16 crop rectangle for a given frame size.

    The crop is centred on the speaker's face with a configurable
    head-room factor so the face isn't stuck at the top.

    Parameters
    ----------
    head_room : float
        Fraction of crop height to place above the face bbox top.
        0.15 means 15 % of the crop height is reserved above the head.
    face_fraction : float
        How much of the crop height the face (bbox height) should occupy.
        0.40 → face fills ~40 % of the frame height.
    """

    def __init__(self, head_room: float = 0.15, face_fraction: float = 0.38):
        self.head_room = head_room
        self.face_fraction = face_fraction

    def target_center(
        self,
        bbox: np.ndarray,
        frame_w: int,
        frame_h: int,
        crop_w: int,
        crop_h: int,
    ) -> tuple[float, float]:
        """
        Compute the ideal crop center given a face bounding box.

        The vertical center is biased upward so the face appears
        in the upper-middle portion of the portrait frame.
        """
        x1, y1, x2, y2 = bbox
        face_cx = (x1 + x2) / 2
        face_cy = (y1 + y2) / 2
        face_h = y2 - y1

        # Desired top of crop:
        # place face_top at (head_room * crop_h) from crop_top
        # → face_top = crop_top + head_room * crop_h
        # → crop_top = face_top - head_room * crop_h
        # → crop_cy   = crop_top + crop_h/2
        crop_cy = y1 - self.head_room * crop_h + crop_h / 2

        # Horizontal: centre on face
        crop_cx = face_cx

        return crop_cx, crop_cy

    def clamp_center(
        self,
        cx: float,
        cy: float,
        frame_w: int,
        frame_h: int,
        crop_w: int,
        crop_h: int,
    ) -> tuple[float, float]:
        """Clamp so crop stays inside the frame."""
        cx = np.clip(cx, crop_w / 2, frame_w - crop_w / 2)
        cy = np.clip(cy, crop_h / 2, frame_h - crop_h / 2)
        return cx, cy

    def compute_crop_size(self, frame_w: int, frame_h: int) -> tuple[int, int]:
        """
        Compute the largest 9:16 crop that fits inside the frame.
        """
        # Try fitting by height first
        crop_h = frame_h
        crop_w = int(crop_h * 9 / 16)
        if crop_w > frame_w:
            crop_w = frame_w
            crop_h = int(crop_w * 16 / 9)
        return crop_w, crop_h

    def extract(
        self,
        frame: np.ndarray,
        cx: float,
        cy: float,
        crop_w: int,
        crop_h: int,
        out_w: int = 1080,
        out_h: int = 1920,
    ) -> np.ndarray:
        """
        Extract and resize the crop from the frame.

        Parameters
        ----------
        frame   : BGR numpy array (H, W, 3)
        cx, cy  : smoothed crop center
        crop_w, crop_h : crop dimensions in original frame pixels
        out_w, out_h   : output resolution (default 1080×1920)
        """
        import cv2

        fh, fw = frame.shape[:2]
        x1 = int(cx - crop_w / 2)
        y1 = int(cy - crop_h / 2)
        x1 = np.clip(x1, 0, fw - crop_w)
        y1 = np.clip(y1, 0, fh - crop_h)
        x2 = x1 + crop_w
        y2 = y1 + crop_h

        crop = frame[y1:y2, x1:x2]
        if crop.shape[0] != out_h or crop.shape[1] != out_w:
            crop = cv2.resize(crop, (out_w, out_h), interpolation=cv2.INTER_LANCZOS4)
        return crop
