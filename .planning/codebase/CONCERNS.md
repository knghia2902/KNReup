# Codebase Concerns: Unused, Test, and Temporary Files

This document lists files and directories that appear to be test scripts, temporary data, logs, or deprecated components that should be reviewed or cleaned up before pushing to GitHub.

## 1. Untracked Temporary Files (Trash / Rác)
These are leftovers from previous testing and should be deleted so they aren't accidentally committed.
- `python-sidecar/dummy_mixed.wav`
- `python-sidecar/dummy_mixed2.wav`
- `python-sidecar/dummy_voice.wav`

## 2. Test Scripts & Logs (Đã được chặn bởi .gitignore)
The `.gitignore` is correctly configured to ignore these files, so they **will not** be pushed to GitHub. However, you can delete them locally to free up space.
- `python-sidecar/test_audio_mix.py`
- `python-sidecar/test_audio_mix2.py`
- `python-sidecar/.pytest_cache/`
- `python-sidecar/logs/*.log`
- `python-sidecar/data/history/`

## 3. Deprecated Components (Frontend)
With the migration to the Video Gen Lab, these old Preview components might be obsolete. If they are no longer used anywhere, they should be deleted.
- `src/components/TemplatePreview/` (Entire folder including `TemplatePreviewStudio.tsx` and `templateData.ts`).
- `src/styles/template-preview.css`
- `src/components/editor/AssetPlaceholder.tsx` (Verify if still used)

## Recommendation
1. Delete the `dummy_*.wav` files in `python-sidecar/`.
2. Confirm if `TemplatePreview` is still needed. If not, delete it to keep the repository clean.
