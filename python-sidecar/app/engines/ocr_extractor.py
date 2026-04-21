import cv2
import logging
import os
import time
from typing import List, Dict
from app.utils.gpu_detect import _inject_nvidia_dll_paths

logger = logging.getLogger(__name__)

class VideoOcrExtractor:
    def __init__(self, lang: str = "vi"):
        _inject_nvidia_dll_paths()
        try:
            from rapidocr_onnxruntime import RapidOCR
            # Khởi tạo đơn giản nhất nhưng ép dùng GPU
            self.reader = RapidOCR(
                det_use_cuda=True, 
                rec_use_cuda=True, 
                cls_use_cuda=True,
                print_verbose=False
            )
            logger.info("RapidOCR initialized (GPU Mode)")
        except Exception as e:
            logger.error(f"Failed to load RapidOCR: {e}")
            self.reader = None

    def extract_hardsubs(self, video_path: str, region: dict, lang: str = "vi") -> List[Dict]:
        """
        Trích xuất phụ đề: Tốc độ cao nhất, CPU thấp nhất.
        """
        if not self.reader:
            return []
            
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps <= 0: fps = 25
            
        extracted_segments = []
        current_text = None
        current_start = 0
        current_end = 0

        # OCR mỗi 1.5 giây (đủ để bắt sub mà vẫn cực nhanh)
        skip_frames = int(fps * 1.5)
        count = 0
        
        logger.info(f"Processing OCR: {video_path} (Sequential Mode)")

        while cap.isOpened():
            # grab() cực nhanh, không tốn CPU giải mã
            if not cap.grab():
                break
            
            if count % skip_frames != 0:
                count += 1
                continue
            
            # Chỉ decode đúng khung hình cần OCR
            ret, frame = cap.retrieve()
            if not ret: break
                
            sec = count / fps
            count += 1
                
            # Crop vùng OCR
            x, y, w, h = int(region.get("x", 0)), int(region.get("y", 0)), int(region.get("w", 0)), int(region.get("h", 0))
            if w > 0 and h > 0:
                h_f, w_f = frame.shape[:2]
                y1, y2 = max(0, y-10), min(h_f, y+h+10)
                x1, x2 = max(0, x-10), min(w_f, x+w+10)
                crop = frame[y1:y2, x1:x2]
            else:
                crop = frame

            if crop.size == 0: continue

            # Xử lý bằng GPU
            results, _ = self.reader(crop)
            
            text = ""
            if results:
                text = " ".join([res[1] for res in results if res[1]]).strip()

            if text:
                if current_text == text:
                    current_end = sec + 1.5
                else:
                    if current_text:
                        extracted_segments.append({"start": current_start, "end": current_end, "text": current_text, "type": "ocr"})
                    current_text, current_start, current_end = text, sec, sec + 1.5
            else:
                if current_text:
                    extracted_segments.append({"start": current_start, "end": current_end, "text": current_text, "type": "ocr"})
                    current_text = None
            
            # Sleep siêu nhỏ để OS không báo Full Load ảo
            time.sleep(0.001)

        if current_text:
            extracted_segments.append({"start": current_start, "end": current_end, "text": current_text, "type": "ocr"})
            
        cap.release()
        return extracted_segments
