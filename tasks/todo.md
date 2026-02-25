# Semantic Variation Upgrade Plan (2026-02-24)

## Goal
Increase output variation by moving from single-label mood mapping to semantic feature extraction that captures user intent, imagery, and style cues.

## Requirements
- Keep existing API behavior working (`keyword`, `mood`, `artParams`) while adding optional metadata.
- Preserve deterministic behavior where needed (same input can still be reproducible with seed).
- Avoid prompt bloat and high latency from multi-step LLM chains on every request.
- Make variation measurable with clear metrics before and after.

## Scope
- In:
  - `src/lib/ai/types.ts` (`MoodResult` extension to semantic profile).
  - `src/lib/ai/providers/*.ts` (new structured extraction prompt).
  - `src/app/api/art/generate/route.ts` (semantic-aware generation flow).
  - `src/lib/art-generator/index.ts` (map semantic profile into params).
  - `src/test/*` (contract + behavior tests).
- Out:
  - Full model fine-tuning.
  - Database schema changes unless required for analytics.

## Strategy (Recommended)
1. Replace single mood classification with a compact semantic profile:
   - `coreMood` (compatible with old mood buckets),
   - `energy` (0-1),
   - `valence` (-1 to 1),
   - `imageryTags` (e.g. ocean, dusk, city, forest),
   - `styleHints` (e.g. minimal, abstract, geometric, organic),
   - `tempo` (calm/medium/fast).
2. Use profile -> generator mapping as the primary driver for variation, with mood only as a fallback prior.
3. Add a lightweight optional expansion step only for sparse inputs (1-2 words), not for all inputs:
   - Expand to short scene description (1-2 lines), then re-extract profile.
4. Add controlled randomness knobs (`temperature-like` variation scalar) inside generator mapping rather than relying on unstable LLM wording.

## Alternative (Optional A/B)
1. Poetry-first pipeline:
   - keyword -> short poem -> key info extraction -> params.
2. Use this only as an experiment arm because it increases latency and can drift semantically.

## Action Items
- [x] Define `SemanticProfile` TS type and backward-compatible API response contract.
- [x] Design a JSON-only extraction prompt for providers to return stable structured fields.
- [x] Implement strict validation/sanitization with defaults when model output is missing fields.
- [x] Refactor `generateArtParams` to consume `SemanticProfile` and blend with existing mood ranges.
- [x] Add sparse-input expansion gate (`keyword.length`/token count threshold) and benchmark latency impact.
- [x] Add A/B switch (`direct-semantic` vs `expand-then-extract`) via env flag for experimentation.
- [x] Add tests: parser robustness, mapping determinism, and variation-delta regression checks.
- [x] Add observability metadata in response (`debug.semanticProfile`, `debug.pipelinePath`).
- [x] Run `npm run test` and targeted manual prompts to verify higher semantic fidelity and diversity.

## Testing and Validation
- Functional:
  - Same keyword with different semantic cues should produce clearly different palettes/composition.
  - Semantically close phrases should preserve thematic consistency.
- Quantitative:
  - Track pairwise parameter distance across a fixed prompt set before/after.
  - Track API latency P50/P95 with and without expansion gate.
- Robustness:
  - Empty/noisy inputs should fall back gracefully to neutral defaults.
  - Non-English keywords should not break schema parsing.

## Risks and Edge Cases
- Over-expansion may hallucinate details and reduce user-control fidelity.
- Too many semantic dimensions can produce unstable visuals unless weighted carefully.
- Provider output format drift requires strict schema guardrails.
- Randomness can mask semantic gains if not bounded.

## Review
- Status: Implemented.
- Core delivery:
  - Added semantic schema in AI layer (`semanticProfile`: `coreMood`, `energy`, `valence`, `tempo`, `imageryTags`, `styleHints`, optional `expandedPrompt`, `pipelinePath`).
  - Updated OpenAI/Kimi/Claude providers to use a shared structured prompt + parser with strict fallback sanitization.
  - Added pipeline strategy switch via env: `SEMANTIC_PIPELINE_MODE=auto|direct|expand`.
  - Refactored generator to consume semantic profile and influence color, shape weighting, motion, chaos, and rotation.
  - Extended `/api/art/generate` response with additive `debug` payload for observability.
- Tests and checks:
  - `npm run test`: pass (12/12).
  - `npm run lint`: pass with one existing non-blocking warning in `src/app/layout.tsx` (font loading rule).
  - `npx tsc --noEmit`: pass.
- Notes:
  - Poetry-first expansion remains an optional future A/B arm; not enabled by default in this implementation.

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

# Dual Option Artwork Plan (2026-02-25)

## Goal
Support side-by-side artwork comparison by generating two options per request, allowing users to select one and inspect/save the selected option.

## Action Items
- [x] Extend `/api/art/generate` request/response contract with `optionCount` and `options` while keeping `artParams` backward compatible.
- [x] Refactor home page preview state to support selectable options and selected option tracking.
- [x] Implement compare UI (Option A/B), selection affordance, and right-panel inspector binding to selected option.
- [x] Ensure save flow persists only the selected option.
- [x] Update API tests to validate default single-option behavior and explicit two-option behavior.
- [x] Run verification commands and record results in review.

## Review
- Status: Implemented
- Files changed:
  - `src/app/api/art/generate/route.ts`
  - `src/app/page.tsx`
  - `src/test/art-generate.test.ts`
  - `tasks/dual-option-artwork-plan.md`
  - `tasks/todo.md`
- Validation:
  - `npm run test`: pass (13/13)
  - `npx tsc --noEmit`: pass
  - `npm run lint`: pass with one existing warning in `src/app/layout.tsx` (`@next/next/no-page-custom-font`)

# Option Diversity Upgrade (2026-02-25)

## Goal
Increase perceptual difference between Option A/B for the same keyword while locking mood/semantic intent.

## Action Items
- [x] Add optional variation context to generator without breaking existing API calls.
- [x] Refactor generator into baseline generation plus controlled per-option perturbation.
- [x] Replace shape type sampling with deterministic seed-based weighted sampling and fix no-recompute-weight issue.
- [x] Add option distance metric and route-level retry with stronger variation when distance is below threshold.
- [x] Keep `/api/art/generate` backward compatibility (`artParams === options[0].artParams`).
- [x] Add/extend tests for route behavior and generator variation behavior.
- [x] Add plan doc in `tasks/option-diversity-plan.md`.

## Review
- Status: Implemented
- Files changed:
  - `src/lib/art-generator/index.ts`
  - `src/app/api/art/generate/route.ts`
  - `src/test/setup.ts`
  - `src/test/art-generate.test.ts`
  - `src/test/art-generator-variation.test.ts`
  - `tasks/option-diversity-plan.md`
- Validation:
  - `npm run test`: pass (17/17)
  - `npx tsc --noEmit`: pass
