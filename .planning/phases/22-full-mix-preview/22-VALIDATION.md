---
phase: 22
slug: full-mix-preview
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser testing (Web Audio API) |
| **Config file** | none |
| **Quick run command** | `npm run dev` → open Editor → load video |
| **Full suite command** | `npm run dev` → full mix workflow test |
| **Estimated runtime** | ~60 seconds manual |

---

## Sampling Rate

- **After every task commit:** Run `npm run dev` và verify audio routing hoạt động
- **After every plan wave:** Full play/seek/scrub test cycle
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 22-01-01 | 01 | 1 | AudioMixer singleton | manual | Dev tools: check AudioContext state | ⬜ pending |
| 22-01-02 | 01 | 1 | Video routing | manual | Play video → hear audio through Web Audio | ⬜ pending |
| 22-01-03 | 01 | 1 | BGM routing | manual | Import BGM → hear mixed audio | ⬜ pending |
| 22-01-04 | 01 | 1 | Volume sliders | manual | Drag slider → instant volume change | ⬜ pending |
| 22-01-05 | 01 | 1 | TTS playback | manual | Play → TTS segments at correct timestamps | ⬜ pending |
| 22-01-06 | 01 | 1 | Seek/Scrub | manual | Scrub silent, seek+play resumes | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*"Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Why Manual | Test Instructions |
|----------|------------|-------------------|
| Real-time audio mixing | Web Audio API requires browser | Load video → play → adjust volume sliders → verify audio changes |
| TTS segment scheduling | Requires TTS files generated | Generate TTS → play → verify segments at correct times |
| Seek/Scrub behavior | Interactive gesture testing | Drag playhead rapidly → verify silence; click seek → verify audio resumes |
| Mini mixer indicators | Visual verification | Check Timeline track headers for volume indicators |

---

## Validation Sign-Off

- [ ] All tasks have manual verify instructions
- [ ] Sampling continuity maintained
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
