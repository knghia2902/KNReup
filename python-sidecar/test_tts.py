import asyncio
from app.engines.tts.edge_tts_engine import EdgeTTSEngine
from app.engines.tts.piper_engine import PiperTTSEngine

async def main():
    print("--- TESTING PIPER ---")
    try:
        piper = PiperTTSEngine()
        # the engine has download_model method? Let's try downloading
        try:
            from app.engines.tts.piper_engine import MODEL_URLS
            if "vi-VN-x-medium" in MODEL_URLS:
                print("Downloading Piper model vi-VN-x-medium...")
                await piper.download_model("vi-VN-x-medium")
                print("Piper model downloaded successfully.")
            else:
                print("vi-VN-x-medium not in MODEL_URLS?")
        except Exception as e:
            print("Piper download failed:", e)
    except Exception as e:
        print("Piper init failed:", e)

    print("\n--- TESTING EDGE TTS ---")
    edge = EdgeTTSEngine()
    try:
        print("Test 1: Basic synthesis...")
        await edge.synthesize("Xin chào, đây là giọng Hoài My", voice="vi-VN-HoaiMyNeural", output_path="test_edge1.mp3")
        print("Edge Test 1 success")
    except Exception as e:
        print("Edge Test 1 failed:", e)

    try:
        print("Test 2: With Pitch 1.5...")
        await edge.synthesize("Xin chào, đây là giọng Hoài My", voice="vi-VN-HoaiMyNeural", output_path="test_edge2.mp3", pitch=1.5)
        print("Edge Test 2 success")
    except Exception as e:
        print("Edge Test 2 failed:", e)

    try:
        print("Test 3: With Pitch 0.5 (Hz mode?)...")
        # Let's try changing pitch manually to Hz if % fails
        import edge_tts
        pitch_str = "+50Hz"
        comm = edge_tts.Communicate("Xin chào, đây là giọng Hoài My", "vi-VN-HoaiMyNeural", pitch=pitch_str)
        await comm.save("test_edge3.mp3")
        print("Edge Test 3 (+Hz) success")
    except Exception as e:
        print("Edge Test 3 (+Hz) failed:", e)

if __name__ == "__main__":
    asyncio.run(main())
