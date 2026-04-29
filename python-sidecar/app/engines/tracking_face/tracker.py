"""
Simple IoU-based face tracker.
Assigns stable IDs to faces across frames so we can track
lip-movement history per person.
"""
from __future__ import annotations

import numpy as np


def _iou(a: np.ndarray, b: np.ndarray) -> float:
    """Intersection-over-Union of two [x1,y1,x2,y2] boxes."""
    ix1 = max(a[0], b[0])
    iy1 = max(a[1], b[1])
    ix2 = min(a[2], b[2])
    iy2 = min(a[3], b[3])
    inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
    area_a = (a[2] - a[0]) * (a[3] - a[1])
    area_b = (b[2] - b[0]) * (b[3] - b[1])
    union = area_a + area_b - inter
    return inter / union if union > 0 else 0.0


class FaceTracker:
    """
    Maintains face identities across frames using greedy IoU matching.

    Parameters
    ----------
    iou_threshold : float
        Minimum IoU to consider two boxes as the same face.
    max_lost : int
        Frames a face can be unseen before its ID is retired.
    """

    def __init__(self, iou_threshold: float = 0.35, max_lost: int = 10):
        self.iou_threshold = iou_threshold
        self.max_lost = max_lost
        self._tracks: dict[int, dict] = {}   # id -> {bbox, lost}
        self._next_id = 0

    def update(self, detections: list[dict]) -> list[dict]:
        """
        Match detections to existing tracks.

        Returns
        -------
        list of dict:
            id    : stable face ID (int)
            bbox  : [x1,y1,x2,y2]
            score : detection confidence
            new   : True if this is a freshly assigned ID
        """
        if not self._tracks:
            # Bootstrap
            results = []
            for det in detections:
                tid = self._next_id
                self._next_id += 1
                self._tracks[tid] = {"bbox": det["bbox"], "lost": 0}
                results.append({**det, "id": tid, "new": True})
            return results

        track_ids = list(self._tracks.keys())
        track_bboxes = [self._tracks[t]["bbox"] for t in track_ids]
        matched_tracks: set[int] = set()
        matched_dets: set[int] = set()
        results = []

        # Greedy match by IoU
        iou_matrix = np.zeros((len(track_ids), len(detections)))
        for ti, tb in enumerate(track_bboxes):
            for di, det in enumerate(detections):
                iou_matrix[ti, di] = _iou(tb, det["bbox"])

        while True:
            if iou_matrix.size == 0:
                break
            idx = np.unravel_index(np.argmax(iou_matrix), iou_matrix.shape)
            ti, di = int(idx[0]), int(idx[1])
            if iou_matrix[ti, di] < self.iou_threshold:
                break
            tid = track_ids[ti]
            self._tracks[tid]["bbox"] = detections[di]["bbox"]
            self._tracks[tid]["lost"] = 0
            results.append({**detections[di], "id": tid, "new": False})
            iou_matrix[ti, :] = -1
            iou_matrix[:, di] = -1
            matched_tracks.add(ti)
            matched_dets.add(di)

        # New faces
        for di, det in enumerate(detections):
            if di not in matched_dets:
                tid = self._next_id
                self._next_id += 1
                self._tracks[tid] = {"bbox": det["bbox"], "lost": 0}
                results.append({**det, "id": tid, "new": True})

        # Age out lost tracks
        dead = []
        for ti, tid in enumerate(track_ids):
            if ti not in matched_tracks:
                self._tracks[tid]["lost"] += 1
                if self._tracks[tid]["lost"] > self.max_lost:
                    dead.append(tid)
        for tid in dead:
            del self._tracks[tid]

        return results
