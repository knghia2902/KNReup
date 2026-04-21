---
status: investigating
trigger: "Giải quyết các cảnh báo môi trường (deprecation & dependency warnings) và kiểm tra lại toàn bộ tính năng GPU/OCR một lần cuối"
created: 2026-04-21T17:20:00+07:00
updated: 2026-04-21T17:20:00+07:00
---

# Debug Session: resolve-env-warnings-gpu-check

## Symptoms
- **Expected**: Log sạch sẽ, không còn cảnh báo vàng/đỏ.
- **Actual**: Cảnh báo pynvml, urllib3/requests, và mwt xuất hiện khi bắt đầu OCR. OCR đã chạy nhanh trên GPU.
- **Errors**:
    - `FutureWarning: The pynvml package is deprecated. Please install nvidia-ml-py instead.`
    - `RequestsDependencyWarning: urllib3 (2.6.3) or chardet (7.1.0)/charset_normalizer (3.4.6) doesn't match a supported version!`
    - `WARNING: Language en package default expects mwt, which has been added`
- **Timeline**: Ngay sau khi nâng cấp CUDA 12.4 và bắt đầu OCR.
- **Reproduction**: Bắt đầu OCR.

## Current Focus
- hypothesis: null
- test: null
- expecting: null
- next_action: "gather initial evidence"

## Evidence
(None yet)

## Eliminated
(None yet)
