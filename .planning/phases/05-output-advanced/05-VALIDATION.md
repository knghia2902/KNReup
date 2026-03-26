---
phase: 05
slug: output-advanced
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-26
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | manual and ffmpeg CLI output checks |
| **Config file** | none |
| **Quick run command** | `pytest test_output_builder.py` (to be created) |
| **Full suite command** | N/A |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run manual validation script
- **After every plan wave:** Check complete pipeline logic
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | M2-06, M2-07, M2-08, M2-09, M2-10 | unit | `pytest test_pipeline_config.py` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | M2-06, M2-07, M2-08, M2-09, M2-10 | unit | `pytest test_ffmpeg_builder.py` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/test_pipeline_config.py` — unit tests for new PipelineConfig fields
- [ ] `tests/test_ffmpeg_builder.py` — unit tests for FFmpeg syntax generation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual Blur check | M2-07 | Visual | Run pipeline, check output video for blurred region |
| BGM Ducking | M2-09 | Audio | Run pipeline with BGM, listen to hear volume reduce during TTS |
| Watermark UI | M2-08 | Visual | Check if overlay is positioned correctly on exported video |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-26
