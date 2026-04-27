---
created: 2026-04-27T08:50:37+07:00
title: Add OCR module settings config
area: settings
files: []
---

## Problem
Hiện tại cấu hình của OCR module (như việc sử dụng GPU, đường dẫn model, hoặc độ nhạy/ngôn ngữ cho RapidOCRONNX) chưa được đưa ra giao diện người dùng. Cần một tính năng dạng cấu hình Settings để người dùng có thể tùy chỉnh.

## Solution
- Bổ sung nhóm Settings cho hạng mục "OCR Extraction" trên phần mềm (Frontend).
- Cung cấp các tuỳ chỉnh: sử dụng RapidOCR với thiết lập có cho phép chạy GPU hay CPU-only, cấu hình độ ưu tiên, v.v.
- Đồng bộ tuỳ chỉnh (Settings/Config state) từ Frontend gọi xuống Backend để pipeline `ocr_extractor.py` chạy ăn theo.
