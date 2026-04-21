import cv2
import logging
from typing import List, Dict
from app.utils.gpu_detect import _inject_nvidia_dll_paths

logger = logging.getLogger(__name__)

class VideoOcrExtractor:
    def __init__(self, lang: str = "vi"):
        _inject_nvidia_dll_paths()
        try:
            import onnxruntime
            providers = onnxruntime.get_available_providers()
            logger.info(f"Available ONNX providers: {providers}")
            
            from rapidocr_onnxruntime import RapidOCR
            # RapidOCR doesn't allow passing providers to __init__ easily in some versions,
            # but it uses onnxruntime under the hood which follows the provider order.
            self.reader = RapidOCR(print_verbose=False)
            
            # Ghi log provider ra file riêng để dễ debug
            with open("gpu_debug.log", "a") as f:
                import datetime
                f.write(f"\n--- {datetime.datetime.now()} ---\n")
                f.write(f"ONNX Providers: {onnxruntime.get_available_providers()}\n")
                try:
                    if hasattr(self.reader, 'text_det'):
                        f.write(f"Det Provider: {self.reader.text_det.session.get_providers()}\n")
                    if hasattr(self.reader, 'text_rec'):
                        f.write(f"Rec Provider: {self.reader.text_rec.session.get_providers()}\n")
                except Exception as e:
                    f.write(f"Log error: {e}\n")
            
            logger.info("RapidOCR initialized")
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

        import time
        sec = 0
        skip_frames = int(fps * 2) # OCR every 2 seconds for performance
        count = 0
        
        while cap.isOpened():
            # grab() is much faster than read() as it doesn't decode the image
            if not cap.grab():
                break
            
            if count % skip_frames != 0:
                count += 1
                continue
            
            # Only decode the frame we actually need
            ret, frame = cap.retrieve()
            if not ret:
                break
                
            sec = count // int(fps)
            count += 1
            
            # Tiny sleep to prevent 100% CPU thread lock
            time.sleep(0.01)
                
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
