---
slug: win-error-206-memory-issue
status: resolved
trigger: "Analyze fails with WinError 206 (path too long) and DLL load failed (not enough memory) for cv2."
goal: find_and_fix
tdd_mode: false
specialist_dispatch_enabled: true
---

# Debug Session: WinError 206 and Memory Issue

## Symptoms
- Analyzing an imported video fails.
- Error 1: `[WinError 206] The filename or extension is too long: '...torch\\lib'`
- Error 2: `DLL load failed while importing cv2: Not enough memory resources are available to process this command.`
- Regression: Worked before recent timeline/proxy changes.

## Current Focus
- **Hypothesis:** 
    1. The long path issue is a Windows environment limitation triggered by redundant DLL injection.
    2. The memory issue (`cv2`) is a misleading error caused by `PATH` overflow or a real resource exhaustion after long runs.
- **Next Action:** 
    1. Fix `gpu_detect.py` to handle DLL injection robustly and only once.
    2. Improve memory management in `pipeline_runner.py`.

## Evidence
- 2026-04-22: User reported both WinError 206 and Memory error during Analyze.
- 2026-04-24: Fixed redundant DLL injection and added explicit memory cleanup.

## Resolution
- **root_cause:** Redundant injection of DLL paths into `PATH` and DLL search list exceeded Windows limits (WinError 206). Misleading "Not enough memory" errors were side effects of the corrupted environment block during DLL loading. Heavy models were also not being released after use.
- **fix:** 
    1. Modified `gpu_detect.py` to run `_inject_nvidia_dll_paths` only once, deduplicate paths, and store DLL handles.
    2. Modified `pipeline_runner.py` to explicitly delete model objects and call `gc.collect()` / `torch.cuda.empty_cache()` after Whisper, OCR, and TTS stages.
