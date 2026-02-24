# Homepage Generation Form Debug Plan

## Goal
Improve the home page generation experience for debugging by switching to a left-right layout: artwork preview on the left, generation process parameters on the right, so generation decisions are transparent and easier to inspect.

## Requirements
- Keep the current generate/save flow working.
- Maintain existing API compatibility first (`keyword`, `mood`, `artParams`), then extend for debug metadata if needed.
- Make debug information readable without overwhelming the primary preview.
- Keep responsive behavior good on mobile (stacked layout) and desktop (two-column layout).

## Scope
- In:
  - `src/app/page.tsx` generation section layout and form UX improvements.
  - Optional API response extension for debug info in `src/app/api/art/generate/route.ts`.
  - Optional generator metadata shaping in `src/lib/art-generator/index.ts` for explainability.
- Out:
  - Gallery page redesign.
  - Art rendering algorithm overhaul.
  - Database schema changes unless absolutely necessary.

## Files and Entry Points
- `src/app/page.tsx`
- `src/app/api/art/generate/route.ts`
- `src/lib/art-generator/index.ts`
- `src/components/SvgArtCanvas.tsx` (read-only reference for parameter meaning; edit only if required)

## Proposed UX/Architecture
1. Convert current centered preview block into a two-panel debug workstation:
   - Left: large artwork canvas card + mood/keyword summary + save actions.
   - Right: parameter inspector card(s) with grouped values.
2. Keep form on top, but add debug-oriented controls:
   - optional keyword presets/history chips,
   - loading stage hint (analyzing mood -> generating params -> rendering).
3. Display explainability groups on the right:
   - Input: keyword, detected mood, confidence (if available).
   - Composition: `shapeTypes`, `layerCount`, `complexity`, `positionBias`.
   - Motion/energy: `motionSpeed`, `chaosLevel`, `rotationVariance`.
   - Styling: `colors`, `backgroundColors`, `strokeWidth`, `sizeCurve`, `seed`.
4. If current response lacks enough explainability context, add `debug` payload from API (non-breaking additive field), e.g.:
   - `moodAnalysis` metadata (confidence/raw classifier label when available),
   - deterministic derivation summary from keyword hashes/properties.

## Action Items
- [x] Baseline review: map current homepage generation state transitions and identify exact insertion points for split layout.
- [x] Define debug data contract in TypeScript (front-end type + API response shape), ensuring backward compatibility.
- [x] Implement desktop-first two-column generation workspace in homepage with responsive fallback to stacked mobile layout.
- [x] Implement right-side parameter inspector UI with grouped sections and consistent formatting (badges, key-value rows, color swatches).
- [x] Add optional loading pipeline indicators and subtle transitions for better process observability.
- [x] Validate save flow, gallery refresh, and error states still work with the new structure.
- [x] Run lint/test checks and do manual regression verification for generate/save/delete flows.
- [x] Fill review section below with outcomes, screenshots notes, and any follow-up tasks.
- [x] Check in with user for plan approval before implementation.

## Testing and Validation
- Automated:
  - `npm run lint` (or project equivalent)
  - `npm run test` (or targeted tests around generate endpoint/UI if available)
- Manual:
  - Generate artwork with multiple keywords and verify right panel values update correctly each run.
  - Confirm loading state sequence and disabled states for form controls.
  - Save generated artwork and verify gallery list refreshes.
  - Test desktop and mobile viewport behavior for two-column/stacked transitions.
  - Confirm errors are visible and do not break layout.

## Risks and Edge Cases
- API debug payload additions can drift from UI type assumptions; keep additive and optional.
- Long arrays (colors/shapeTypes) can overflow the panel; enforce wrapping/truncation strategy.
- Frequent regenerate actions may create stale UI states; ensure updates are tied to latest request lifecycle.
- Mobile density can become too high; prioritize concise key values and collapsible groups if needed.

## Review
- Status: Implemented
- Implementation started: Yes
- Files changed:
  - `src/app/page.tsx`
- Delivered:
  - Reworked generation result area into responsive two-column inspector workspace.
  - Left panel now focuses on artwork preview and save action.
  - Right panel now shows process stages plus grouped generation parameters (input/identity, composition, dynamics, styling with color swatches).
  - Improved generate button/loading copy and removed duplicate `setSavedId` call.
- Validation:
  - `npx tsc --noEmit`: pass.
  - `npm run test`: fails in existing `src/test/art-generate.test.ts` assertion expecting `mixed/single` response fields from `/api/art/generate`; unrelated to homepage change.
  - `npm run lint`: blocked by Next.js initial ESLint interactive setup prompt (no `.eslintrc` configured yet).
- Follow-up:
  - Completed on 2026-02-24:
    - Added `.eslintrc.json` with `next/core-web-vitals` + `next/typescript`.
    - Updated `src/test/art-generate.test.ts` to assert current `/api/art/generate` response contract (`artParams`).
    - Cleared existing lint errors across touched files; `npm run lint` now exits successfully (1 non-blocking warning in `src/app/layout.tsx` about font loading strategy).
    - `npm run test` now passes (7/7).
