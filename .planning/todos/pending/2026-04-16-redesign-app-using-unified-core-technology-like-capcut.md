---
created: 2026-04-16T15:12:42.243Z
title: Redesign app using unified core technology like CapCut
area: architecture
files: []
---

## Problem

Hiện tại app đang sử dụng hệ thống pipeline 2 bước tách biệt: render preview trên frontend bằng Canvas/Web, sau đó xuất file bằng FFmpeg + LibASS dưới backend. Mặc dù đã cố gắng đồng bộ (ví dụ hệ số 1.6x cho LibASS) nhưng cách tiếp cận này về bản chất vẫn là 2 engine render khác nhau. Điều này gây ra khó khăn lớn trong việc duy trì sự nhất quán tuyệt đối về kích thước, vị trí, font chữ, độ phân giải DPI, shadow, viền, hiệu ứng giữa quá trình preview và kết quả video xuất ra (WYSIWYG bị vi phạm). 

Các ứng dụng edit video hiện đại chuyên nghiệp như CapCut sử dụng chung một lõi công nghệ render duy nhất cho cả lúc hiển thị preview theo thời gian thực và quá trình xuất ra file video cuối cùng.

## Solution

Cần thiết kế lại kiến trúc ứng dụng sử dụng một công nghệ lõi thống nhất:
- TBD: Nghiên cứu các giải pháp lõi dùng chung giữa frontend và backend (ví dụ: WebGL canvas capture, FFmpeg.wasm, hoặc các engine C++/Rust chuyên dụng thông qua bindings).
- TBD: Lên phương án thay thế kiến trúc Web/React + Python FFmpeg wrapper hiện tại thành một rendering layer chung đảm bảo What You See Is What You Get 100%.
