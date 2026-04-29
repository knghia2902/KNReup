"""
Active speaker detection fallback (Area-based Prominence).

Since MediaPipe FaceMesh is structurally broken on Python 3.13 Windows, 
we fallback to a robust Prominence tracking mechanism.
The active speaker is assumed to be the MOST PROMINENT face (largest area).
"""
from __future__ import annotations
from collections import deque


class LipMovementDetector:
    """
    Falls back safely from Lip Tracking to Bounding Box Area Prominence.
    Selects the largest face historically as the active speaker.
    """

    def __init__(self, window: int = 30, **kwargs):
        self.window = window
        self.history: dict[int, deque] = {}

    def update(self, frame_bgr, tracked_faces: list[dict]) -> dict[int, float]:
        """
        Rank faces purely based on their bounding box area (proximity / prominence).
        """
        scores = {}
        for f in tracked_faces:
            face_id = f["id"]
            x1, y1, x2, y2 = f["bbox"]
            area = (x2 - x1) * (y2 - y1)
            
            if face_id not in self.history:
                self.history[face_id] = deque(maxlen=self.window)
                
            self.history[face_id].append(float(area))
            
            # Use average area over the window to avoid flickering
            scores[face_id] = sum(self.history[face_id]) / len(self.history[face_id])
            
        return scores

    def cleanup(self, current_ids: set[int]) -> None:
        """Remove tracked histories for faces that disappeared."""
        stale = set(self.history.keys()) - current_ids
        for s in stale:
            del self.history[s]

    def best_speaker(self, scores: dict[int, float]) -> int | None:
        """Returns the ID of the face with the highest prominence score."""
        if not scores:
            return None
        return max(scores, key=scores.get)
