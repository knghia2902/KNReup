---
slug: global-gpu-synchronization
status: investigating
trigger: "User reports high CPU usage despite previous GPU fixes. Wants 'all synchronized to GPU'. Standalone script sees GPU, app does not."
goal: find_and_fix
tdd_mode: false
specialist_dispatch_enabled: true
---

# Debug Session: Global GPU Synchronization

## Symptoms
- App uses 100% CPU during processing despite GPU-capable hardware.
- `onnxruntime-gpu` and `torch` detect GPU in standalone scripts.
- Changes in source files are not reflected in the app's behavior.

## Current Focus
- **Hypothesis:** GPU initialization in the app (sidecar) is failing or defaulting to CPU, possibly due to environment mismatch or library conflicts. The "changes not reflecting" suggest the app is running from a cached or pre-compiled location (like a Python environment that isn't the one being edited).
- **Next Action:** Verify the active Python environment and library versions used by the app's sidecar.

## Evidence
- (Empty)

## Resolution
- **root_cause:** 
- **fix:** 
