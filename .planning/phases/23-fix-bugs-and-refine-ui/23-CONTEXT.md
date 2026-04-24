# Phase 23: Fix bugs and refine UI - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix existing bugs across the application and refine the user interface for consistency. We will adopt a "hybrid" design system that balances module-specific needs across the application rather than enforcing a singular look globally.
</domain>

<decisions>
## Implementation Decisions

### Design System & Consistency (Hybrid Approach)
- **Core Library:** Adopt `shadcn/ui` + Tailwind CSS (via a global theme provider and CSS variables) to cleanly overhaul the component library and eliminate inline/ad-hoc CSS.
- **Hybrid Visual Language:** 
  - **Editor Module:** Must faithfully mimic CapCut. Professional, dense, dark slate/gray, minimal border-radius (4-6px), flat design. No bouncy animations or excessive padding.
  - **Downloader & Non-Editor Tools:** Retain the modern web app (SaaS) aesthetic (spacious, 20px rounded corners, subtle glassmorphism/shadows, pill-shaped inputs and buttons).
- **Timeline Logic & Visuals:** Re-architect the Zustand state logic and drag/drop event handling to fix lag and snap bugs. Visually align the Timeline tracks and headers with CapCut's dense and intuitive format.

### Organization of Tool Modules
- Main Editor UI must remain separate from Downloader, obeying the Multi-Window Hub structure established in Phase 9.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Guidelines
- `.planning/PROJECT.md` — Project context and CapCut/VideoTransAI references
- `.planning/REQUIREMENTS.md` — Active development requirements
- `src/styles/downloader.css` — Reference for the Downloader's rounded/modern style variables
</canonical_refs>

<specifics>
## Specific Ideas
- Users specifically requested to keep the Editor tab with the "CapCut style" (less rounded, dense, professional) but are okay with the Downloader having the softer, bouncy style. 
- The `shadcn/ui` theme implementation must support this dual-identity, perhaps through CSS variables scoped via wrapper classes (e.g., `.editor-context` vs `.tool-context`).
</specifics>

<deferred>
## Deferred Ideas
None — all UI overhaul is within scope.
</deferred>

---
*Phase: 23-fix-bugs-and-refine-ui*
*Context gathered: via interactive discussion session*
