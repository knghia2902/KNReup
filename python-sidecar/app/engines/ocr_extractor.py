import cv2
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

class VideoOcrExtractor:
    def __init__(self, lang: str = "vi"):
        try:
            # RapidOCR (PaddleOCR v4 ONNX) is SOTA for handling multiline & English/Chinese mixes.
            # Using onnxruntime-gpu ensures this runs insanely fast on CUDA.
            from rapidocr_onnxruntime import RapidOCR
            logger.info("Initializing RapidOCR (ONNX GPU) Engine")
            self.reader = RapidOCR(print_verbose=True)
        except ImportError:
            logger.error("RapidOCR not installed. Run: pip install rapidocr-onnxruntime onnxruntime-gpu")
            self.reader = None
        except Exception as e:
            logger.error(f"Failed to load RapidOCR: {e}")
            self.reader = None

    def extract_hardsubs(self, video_path: str, region: dict, lang: str = "vi") -> List[Dict]:
        """
        region: {"x": x, "y": y, "w": w, "h": h} in pixels
        """
        if not self.reader:
            logger.error("RapidOCR reader not initialized")
            return []
            
        logger.info(f"Extracting OCR from region {region} in {video_path}...")
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if fps <= 0:
            fps = 25
            
        extracted_segments = []
        current_text = None
        current_start = 0
        current_end = 0

        # We keep a bit of padding to ensure the text isn't tightly cropped
        pad = 10

        sec = 0
        while cap.isOpened():
            frame_id = int(fps * sec)
            if frame_id >= frame_count:
                break
                
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_id)
            ret, frame = cap.read()
            if not ret:
                break
                
            x, y, w, h = int(region.get("x", 0)), int(region.get("y", 0)), int(region.get("w", 0)), int(region.get("h", 0))
            if w > 0 and h > 0:
                h_f, w_f = frame.shape[:2]
                y1 = min(max(0, y - pad), h_f)
                y2 = min(max(0, y + h + pad), h_f)
                x1 = min(max(0, x - pad), w_f)
                x2 = min(max(0, x + w + pad), w_f)
                crop = frame[y1:y2, x1:x2]
            else:
                crop = frame

            if crop.size == 0:
                sec += 1
                continue

            results, _ = self.reader(crop)
            
            text = ""
            if results:
                # Merge multiple lines layout
                text = " ".join([res[1] for res in results if res[1]]).strip()

            if text:
                if current_text == text:
                    current_end = sec + 1
                else:
                    if current_text:
                        extracted_segments.append({
                            "start": current_start,
                            "end": current_end,
                            "text": current_text,
                            "type": "ocr"
                        })
                    current_text = text
                    current_start = sec
                    current_end = sec + 1
            else:
                if current_text:
                    extracted_segments.append({
                        "start": current_start,
                        "end": current_end,
                        "text": current_text,
                        "type": "ocr"
                    })
                    current_text = None

            sec += 1

        if current_text:
            extracted_segments.append({
                "start": current_start,
                "end": current_end,
                "text": current_text,
                "type": "ocr"
            })
            
        cap.release()
        logger.info(f"Extracted {len(extracted_segments)} OCR segments using RapidOCR")
        return extracted_segments
