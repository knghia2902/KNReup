import re

with open('python-sidecar/app/engines/tracking_face/pipeline.py', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to replace the `render_from_tracking` method completely
# We'll use regex to match from `def render_from_tracking(` to `os.unlink(tmp_video.name)` or just the legacy comment.

new_method = '''    def render_from_tracking(
        self,
        input_path: str | os.PathLike,
        output_path: str | os.PathLike,
        tracking_data: dict,
        keyframes: list[dict] = None,
        crop_layout: str = "vertical",
        out_resolution: tuple[int, int] | None = None,
        encode_crf: int = 18,
        encode_preset: str = "fast",
        progress_callback: Callable[[int, int], None] | None = None,
    ) -> None:
        """
        Render video 9:16 using arbitrary regions (split or vertical).
        """
        keyframes = keyframes or []
        input_path = Path(input_path)
        output_path = Path(output_path)

        cap = cv2.VideoCapture(str(input_path))
        if not cap.isOpened():
            raise IOError(f"Cannot open video: {input_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fw = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        fh = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        out_w, out_h = out_resolution or (self.out_w, self.out_h)

        tmp_video = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
        tmp_video.close()

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(tmp_video.name, fourcc, fps, (out_w, out_h))

        def get_regions(frame_idx: int) -> list[dict]:
            # Exact
            kf = next((k for k in keyframes if k["frame_idx"] == frame_idx), None)
            if kf: return kf["regions"]
            
            # Interpolate
            kfs = sorted(keyframes, key=lambda x: x["frame_idx"])
            if kfs:
                if frame_idx > kfs[-1]["frame_idx"]: return kfs[-1]["regions"]
                if frame_idx > kfs[0]["frame_idx"]:
                    prev_kf = next((k for k in reversed(kfs) if k["frame_idx"] <= frame_idx), None)
                    next_kf = next((k for k in kfs if k["frame_idx"] > frame_idx), None)
                    if prev_kf and next_kf:
                        t = (frame_idx - prev_kf["frame_idx"]) / (next_kf["frame_idx"] - prev_kf["frame_idx"])
                        interpolated = []
                        for pr in prev_kf["regions"]:
                            nr = next((r for r in next_kf["regions"] if r["id"] == pr["id"]), pr)
                            interpolated.append({
                                "id": pr["id"],
                                "x": pr["x"] + t * (nr["x"] - pr["x"]),
                                "y": pr["y"] + t * (nr["y"] - pr["y"]),
                                "width": pr["width"] + t * (nr["width"] - pr["width"]),
                                "height": pr["height"] + t * (nr["height"] - pr["height"]),
                            })
                        return interpolated
            
            # Fallback to tracking data
            frames = tracking_data["frames"]
            if frame_idx < len(frames):
                cx = frames[frame_idx]["cx"]
                cy = frames[frame_idx]["cy"]
            else:
                cx = frames[-1]["cx"] if frames else fw / 2
                cy = frames[-1]["cy"] if frames else fh / 2
                
            cw = tracking_data["crop_width"]
            ch = tracking_data["crop_height"]
            
            if crop_layout == "split":
                top_h = ch / 2
                return [
                    {"id": "top", "x": cx - cw/2, "y": fh * 0.3 - top_h/2, "width": cw, "height": top_h},
                    {"id": "bottom", "x": cx - cw/2, "y": fh * 0.7 - top_h/2, "width": cw, "height": top_h}
                ]
            else:
                return [{"id": "main", "x": cx - cw/2, "y": cy - ch/2, "width": cw, "height": ch}]

        frame_idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            regions = get_regions(frame_idx)
            out_frame = np.zeros((out_h, out_w, 3), dtype=np.uint8)

            if crop_layout == "split":
                top = next((r for r in regions if r["id"] == "top"), None)
                bot = next((r for r in regions if r["id"] == "bottom"), None)
                half_h = out_h // 2
                
                if top:
                    x, y, w, h = int(top["x"]), int(top["y"]), int(top["width"]), int(top["height"])
                    x = max(0, min(x, fw - w))
                    y = max(0, min(y, fh - h))
                    cropped = frame[y:y+h, x:x+w]
                    if cropped.size > 0:
                        out_frame[0:half_h, 0:out_w] = cv2.resize(cropped, (out_w, half_h))
                
                if bot:
                    x, y, w, h = int(bot["x"]), int(bot["y"]), int(bot["width"]), int(bot["height"])
                    x = max(0, min(x, fw - w))
                    y = max(0, min(y, fh - h))
                    cropped = frame[y:y+h, x:x+w]
                    if cropped.size > 0:
                        out_frame[half_h:out_h, 0:out_w] = cv2.resize(cropped, (out_w, half_h))
                        
                cv2.rectangle(out_frame, (0, half_h - 2), (out_w, half_h + 2), (0,0,0), -1)
            else:
                main = next((r for r in regions if r["id"] == "main"), None)
                if main:
                    x, y, w, h = int(main["x"]), int(main["y"]), int(main["width"]), int(main["height"])
                    x = max(0, min(x, fw - w))
                    y = max(0, min(y, fh - h))
                    cropped = frame[y:y+h, x:x+w]
                    if cropped.size > 0:
                        out_frame = cv2.resize(cropped, (out_w, out_h))

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
'''

import re
# Use regex to find the method
pattern = re.compile(r'    def render_from_tracking\(.*?os\.unlink\(tmp_video\.name\)', re.DOTALL)
new_content = pattern.sub(new_method, content, count=1)

with open('python-sidecar/app/engines/tracking_face/pipeline.py', 'w', encoding='utf-8') as f:
    f.write(new_content)
