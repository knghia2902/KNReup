status: resolved
trigger: "Douyin download fails with AttributeError: 'DouyinHandler' object has no attribute 'download_one_video'"
created: 2026-04-17
updated: 2026-04-17
symptoms:
  - Expected: "Successful download and storage of Douyin video."
  - Actual: "Backend logs show AttributeError when calling download_one_video."
  - Error: "'DouyinHandler' object has no attribute 'download_one_video'"
  - Repro: "Analyze a Douyin link and start download."
---

# Current Focus
**Hypothesis:** The `DouyinHandler` class in `f2` library or our local wrapper has changed its method signature or the method was never implemented/correctly imported.
**Next Action:** Investigation complete.

# Evidence
- timestamp: 2026-04-17T11:54:00Z
  observation: "Terminal logs show 'DouyinHandler' object has no attribute 'download_one_video'"
- timestamp: 2026-04-17T11:58:00Z
  observation: "Inspect revealed handle_one_video() is the correct method, requiring 'url' and 'path' in kwargs."

# Eliminated
- hypothesis: "f2 library is missing." (Eliminated: library is present and fetch_one_video works.)

# Resolution
root_cause: "The codebase was calling a non-existent method `download_one_video` on the `DouyinHandler` object. The correct method in f2 v0.0.1.7 is `handle_one_video`, which delegates to internal downloaders based on the `kwargs` passed during handler initialization."
fix: "Updated `douyin_engine.py` to correctly populate `handler_kwargs` with `url` and `path`, and switched the call to `await handler.handle_one_video()`."
verification: "User to re-test Douyin download."
files_changed: ["python-sidecar/app/engines/downloader/douyin_engine.py"]
