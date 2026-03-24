---
status: testing
phase: 03-nle-editor-ui
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md]
started: 2026-03-24T03:00:00Z
updated: 2026-03-24T03:00:00Z
---

## Current Test

number: 1
name: Cold Start Smoke Test
expected: |
  Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
result: pending

### 2. Workspace Layout & Theme
expected: The app displays a minimalist warm beige theme. The Titlebar, Sidebar, Media Bin (left), Video Preview (center), Properties Panel (right), and Timeline (bottom) layout is correctly structured.
result: pending

### 3. Properties Panel Tabs
expected: Clicking through STYLE, TTS, SUB, and OUT tabs in the right Properties Panel seamlessly switches the settings content.
result: pending

### 4. Media Bin display
expected: The Media Bin displays a 'Drop media' dashed zone and shows populated media items with badges cleanly.
result: pending

### 5. Video Preview & Controls
expected: The Video Preview area has minimal controls (Play button, scrubber, timecode) below it. The black video frame stays bounded centrally.
result: pending

### 6. Interactive Property Controls
expected: Adjusting sliders, toggles, dropdowns, and color pickers in the Properties Panel tabs updates their visual state smoothly (connected to Zustand).
result: pending

### 7. Timeline & Subtitle State
expected: The Subtitle tab lists segments. The Timeline displays corresponding colored track blocks (VID, TTS, SUB, BGM) mapped to segment duration.
result: pending

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0

## Gaps
