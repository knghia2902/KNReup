---
status: investigating
trigger: "Voice Clone 500 Internal Server Error v├á block bß╗ï block bß╗ƒi CORS policy"
created: 2026-04-23
updated: 2026-04-23
---

# Debug Session: voice-clone-500-cors

## Symptoms
1. **Expected behavior**: Voice Clone tool fetch profile v├á gß╗ìi API clone th├ánh c├┤ng.
2. **Actual behavior**: Lß╗Öi 500 khi GET profiles v├á bß╗ï block CORS khi POST clone.
3. **Error messages**: 
   - `GET http://127.0.0.1:8008/api/tts/profiles/ 500 (Internal Server Error)`
   - `Access to fetch at 'http://127.0.0.1:8008/api/tts/profiles/clone' from origin 'http://localhost:1420' has been blocked by CORS policy`
4. **Timeline**: Xß║úy ra sau khi cập nhß║¡t port v├á UI.
5. **Reproduction**: Mß╗ƒ cß╗¡a sß╗ò Voice Clone, app tß╗▒ ─æß╗Öng gß╗ìi GET profiles. Bß║Ñm n├║t Clone gß╗ìi POST clone.

## Current Focus
- **Hypothesis 1**: Backend crash (500) do `OmniVoiceTTSEngine` thiß║┐u file hoß║Àc folder data (profiles).
- **Hypothesis 2**: CORS bß╗ï block do API route mß╗¢i ch╞░a ─æ╞░ß╗úc cho ph├⌐p origin `http://localhost:1420`.
- **Next action**: Kiß╗âm tra `python-sidecar/app/main.py` (CORS) v├á `python-sidecar/app/routes/tts_profiles.py` (logic 500).
