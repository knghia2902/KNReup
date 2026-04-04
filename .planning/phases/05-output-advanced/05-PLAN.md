---
wave: 1
depends_on: []
files_modified:
  - src/components/properties/OutTab.tsx
autonomous: false
gap_closure: true
requirements: []
---

# 05-PLAN: Fix BGM Volume Live Preview

<objective>
Fix UAT Test 1 gap: Make the `<audio>` player element in `OutTab.tsx` react live to the `config.bgm_volume` slider.
</objective>

<tasks>
<task>
<action>
Modify `src/components/properties/OutTab.tsx`:
1. Import `useRef` and `useEffect` from `react` (add to existing imports if any, or create a new import line).
2. Inside `OutTab` component, create a ref `const audioRef = useRef<HTMLAudioElement>(null);`.
3. Attach `ref={audioRef}` to the `<audio>` element.
4. Add a `useEffect` that listens to `config.bgm_volume`. Inside it, if `audioRef.current` exists, set `audioRef.current.volume = config.bgm_volume`.
</action>
<read_first>
- src/components/properties/OutTab.tsx
</read_first>
<acceptance_criteria>
- Volume slider visually controls the `<audio>` output live.
</acceptance_criteria>
</task>
</tasks>
