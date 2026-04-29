"""
Subject detection using Ultralytics YOLOv8 (GPU accelerated via PyTorch).
Uses standard YOLO "person" class to track the subject's entire body/head, 
which often provides a much better vertical 9:16 crop than just the face.
"""
from __future__ import annotations

import cv2
import numpy as np


class FaceDetector:
    """
    Wraps Ultralytics YOLO for incredibly fast and robust GPU detection.
    Instead of just faces, this tracks the 'person' class (index 0) 
    which usually aligns better for 9:16 crops.
    """

    def __init__(self, det_size: tuple[int, int] = (640, 640), gpu_id: int = 0):
        try:
            from ultralytics import YOLO
        except ImportError:
            raise ImportError("ultralytics not installed. Run: pip install ultralytics")

        # Automatically downloads the official yolov8n.pt from Ultralytics
        self.model = YOLO("yolov8n.pt")
        
        # Deploy model to the user's RTX GPU
        self.model.to(f"cuda:{gpu_id}")

    def detect(self, frame_bgr: np.ndarray) -> list[dict]:
        """
        Detect persons in a BGR frame to use as tracking anchor.
        """
        # verbose=False, classes=[0] filters to only 'person'
        results = self.model(frame_bgr, verbose=False, classes=[0])
        out = []

        if len(results) > 0 and len(results[0].boxes) > 0:
            for det in results[0].boxes:
                x1, y1, x2, y2 = det.xyxy[0].cpu().numpy()
                score = float(det.conf[0].cpu().numpy())

                out.append({
                    "bbox": np.array([x1, y1, x2, y2], dtype=np.float32),
                    "score": score
                })
                
        return out
