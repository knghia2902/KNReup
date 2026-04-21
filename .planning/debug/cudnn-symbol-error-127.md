---
status: investigating
trigger: "Could not load symbol cudnnGetLibConfig. Error code 127"
created: 2026-04-21T17:25:00+07:00
updated: 2026-04-21T17:25:00+07:00
---

# Debug Session: cudnn-symbol-error-127

## Symptoms
- **Expected**: OCR và Render chạy mượt trên GPU mà không có lỗi DLL.
- **Actual**: Lỗi `Could not load symbol cudnnGetLibConfig. Error code 127` xuất hiện, sau đó Sidecar bị crash (`ERR_CONNECTION_RESET`).
- **Errors**:
    - `Could not load symbol cudnnGetLibConfig. Error code 127`
    - `WinError 127: The specified procedure could not be found. Error loading torch\lib\cudnn_cnn64_9.dll`
- **Timeline**: Xuất hiện sau khi nâng cấp PyTorch và ONNX Runtime lên CUDA 12.4.
- **Reproduction**: Khởi động sidecar và bắt đầu quy trình trích xuất phụ đề (OCR).

## Current Focus
- hypothesis: null
- test: null
- expecting: null
- next_action: "gather initial evidence"

## Evidence
(None yet)

## Eliminated
(None yet)
