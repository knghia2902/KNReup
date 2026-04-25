# Verification Strategy - Phase 25

## Automated Tests
As we lack an extensive Pytest suite for network components, testing will primarily rely on API integration and logging.
1. Send `PUT /api/download/analyze` with a `tiktok.com` short link. Wait for response and verify `resolutions` list.
2. Search server logs to ensure `TikTokEngine` was invoked rather than `YTdlpEngine`.

## Human Verification Required (UAT)
- [ ] **TikTok Download**: Copy a standard TikTok link. Paste onto Downloader GUI. Expected: Instantly parses without watermark. Target resolution downloads successfully.
- [ ] **Bilibili Download**: Copy a `b23.tv` or `bilibili.com` URL. Expected: Parses successfully, and downloading retrieves highest configured audio+video streams multiplexed into a single output file.
- [ ] **Facebook Download**: Copy a public FB video URL. Expected: Native extraction is performed. If native extraction hits a ratelimit or fails, logs report the error and visibly fallback to `YTdlpEngine`.
- [ ] **Fallback Validation**: Test moving/unlinking behaviors with the newly processed engine-downloaded media to ensure they maintain the `BaseEngine` contract perfectly.
