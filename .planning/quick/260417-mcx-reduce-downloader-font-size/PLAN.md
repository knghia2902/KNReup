# Plan: Reduce Downloader Font Size

The user wants a more compact UI for the download section.

## Proposed Changes

### 1. Variables & Global
- No changes to base variables for now.

### 2. History Table (`dl-recent-table`)
- `dl-rt-head`: Reduce `padding` from `1.5rem 2.5rem` to `1rem 1.5rem`. Reduce `font-size` from `0.75rem` to `0.7rem`.
- `dl-rt-row`: Reduce `padding` from `1.5rem 2.5rem` to `0.85rem 1.5rem`.
- `dl-rtc`: Reduce `font-size` from `0.9rem` to `0.85rem`.
- `dl-rt-thumb`: Reduce size from `64x40` to `56x32`.
- `dl-rt-pct`: Reduce `font-size` from `0.85rem` to `0.8rem`.
- `dl-rt-btn`: Reduce `padding` from `8px 14px` to `6px 12px`.

### 3. Video Info & Formats (`dl-info-card`, `dl-formats-card`)
- `dl-info-title`: Reduce `font-size` from `1.1rem` to `1rem`.
- `dl-info-details`: Reduce `font-size` from `0.95rem` to `0.85rem`.
- `dl-thumbnail`: Reduce `width` from `180px` to `160px`.
- `dl-format-header h3`: Reduce `font-size` from `1.1rem` to `1rem`.
- `dl-fr-title`: Reduce `font-size` from `1rem` to `0.9rem`.
- `dl-fr-sub`: Reduce `font-size` from `0.85rem` to `0.8rem`.
- `dl-fr-download-btn`: Reduce `padding` from `8px 16px` to `6px 12px`, `font-size` to `0.85rem`.

## Verification
- Visually verify through screenshots.
