import cv2
import easyocr
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

class VideoOcrExtractor:
    def __init__(self, lang: str = "vi"):
        try:
            ocr_lang = 'en'
            if lang in ['zh', 'zh-CN', 'ch', 'auto']: ocr_lang = 'ch_sim'
            elif lang == 'ja': ocr_lang = 'ja'
            elif lang == 'ko': ocr_lang = 'ko'
            elif lang == 'vi': ocr_lang = 'vi'
            
            logger.info(f"Initializing EasyOCR with language: {ocr_lang}")
            self.reader = easyocr.Reader([ocr_lang, 'en']) if ocr_lang != 'en' else easyocr.Reader(['en'])
        except Exception as e:
            logger.error(f"Failed to load easyocr: {e}")
            self.reader = None

    def extract_hardsubs(self, video_path: str, region: dict, lang: str = "vi") -> List[Dict]:
        """
        region: {"x": x, "y": y, "w": w, "h": h} in pixels
        """
        if not self.reader:
            logger.error("EasyOCR reader not initialized")
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
                y1 = min(max(0, y), h_f)
                y2 = min(max(0, y + h), h_f)
                x1 = min(max(0, x), w_f)
                x2 = min(max(0, x + w), w_f)
                crop = frame[y1:y2, x1:x2]
            else:
                crop = frame

            if crop.size == 0:
                sec += 1
                continue

            results = self.reader.readtext(crop, detail=0, paragraph=True)
            text = " ".join(results).strip()

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
        logger.info(f"Extracted {len(extracted_segments)} OCR segments")
        return extracted_segments
