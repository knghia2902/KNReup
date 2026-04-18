---
wave: 3
depends_on: []
files_modified:
  - src/components/properties/SettingsTab.tsx
  - src/stores/useProjectStore.ts
autonomous: true
gap_closure: false
requirements: [M2-14]
---

# 05-PLAN: Settings Tab & Multi API Keys

<objective>
To avoid Popup modal bloat, establish a new Settings Tab in the Titlebar or Properties Panel dedicated strictly to managing API Configs for Translation models (Gemini, DeepSeek, OpenAI).
</objective>

<tasks>
<task>
<action>
1. `useProjectStore.ts`: Provide state tree for `apiKeys: { gemini: '', deepseek: '', openai: '' }`. Check if there are keys currently in pipeline logic (e.g. from `.env`) and move them to Zustand persist storage.
2. Create `src/components/properties/SettingsTab.tsx`:
   - Build a vertical form panel listing the models with Password-hidden inputs.
   - Expose current usage quota limit/status if verifiable (Optional/Placeholder UI).
   - Render tab button in the top Titlebar navigation (`Editor / Downloader / Monitor / Settings`).
</action>
<read_first>
- src/stores/useProjectStore.ts
- src/App.tsx
</read_first>
<acceptance_criteria>
- Changing a key in Settings Tab correctly updates `useProjectStore`.
- Keys are masked (`••••••`) in UI.
- No intrusive modals block the UI.
</acceptance_criteria>
</task>
</tasks>
