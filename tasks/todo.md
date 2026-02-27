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

# Artwork Cleanliness Convergence (2026-02-25)

## Goal
Reduce visual clutter by default without introducing new UI controls, while preserving dual-option distance guard behavior.

## Action Items
- [x] Add generator-side cleanliness caps (`shapeTypes/layerCount/complexity/chaos/rotation`) via deterministic post-processing.
- [x] Apply cleanliness enforcement in both base generation and controlled variation paths.
- [x] Upgrade route-level option retry from one-shot recovery to bounded multi-retry with strength escalation.
- [x] Extend generator tests to lock cleanliness bounds and density budget.
- [x] Extend route tests to verify retry cap behavior.
- [x] Run verification commands and record results.

## Review
- Status: Implemented
- Files changed:
  - `src/lib/art-generator/index.ts`
  - `src/app/api/art/generate/route.ts`
  - `src/test/art-generator-variation.test.ts`
  - `src/test/art-generate.test.ts`
  - `tasks/todo.md`
- Validation:
  - `npm run test`: pass (18/18)
  - `npx tsc --noEmit`: pass
- Risks / Notes:
  - Cleanliness caps can reduce perceived diversity for high-energy prompts; mitigate through existing bounded retry in option generation.

# Curve Shape Extension (2026-02-25)

## Goal
Add an organic `curves` shape as an independent shape type, wire it into semantic shape selection, and preserve existing cleanliness constraints.

## Action Items
- [x] Add `curves` rendering branch in `SvgArtCanvas` using deterministic multi-segment bezier paths.
- [x] Keep curve behavior mapped to existing params (`sizeCurve`, `chaosLevel`, `rotationVariance`, `strokeWidth`, layer opacity).
- [x] Insert `curves` into shape layering order between wave-like and spiral-like strokes.
- [x] Add `curves` into mood shape pools for `serene`, `melancholic`, `peaceful`, `mysterious`, and `neutral` with restrained base weights.
- [x] Add semantic/style and imagery boosts for `curves` (`organic/dreamy/abstract`, `ocean/forest/sky/night`).
- [x] Extend tests for curve-related semantic selection behavior and API compatibility.
- [x] Run full verification and capture results below.

## Review
- Status: Implemented
- Files changed:
  - `src/components/SvgArtCanvas.tsx`
  - `src/lib/art-generator/index.ts`
  - `src/test/art-generator-variation.test.ts`
  - `src/test/art-generate.test.ts`
  - `tasks/todo.md`
- Validation:
  - `npm test -- src/test/art-generator-variation.test.ts`: pass
  - `npm test -- src/test/art-generate.test.ts`: pass
  - `npm test`: pass (19/19)
  - `npx tsc --noEmit`: pass

# Serene Visual Density Improvement (2026-02-25)

## Goal
Prevent calm mood outputs (notably `serene`) from collapsing into sparse single-line compositions while preserving clean aesthetics.

## Action Items
- [x] Add calm-mood complexity floor policy in generator output and enforce it in both base and variation paths.
- [x] Update density enforcement logic to reduce layer/shape mix before reducing complexity under floor.
- [x] Add renderer-side minimum wave-path safeguard for low-complexity calm outputs.
- [x] Add/extend tests for calm floor policy, density enforcement behavior, and wave minimum-path rule.
- [x] Run verification commands and capture results.

## Review
- Status: Implemented
- Files changed:
  - `src/lib/art-generator/index.ts`
  - `src/components/SvgArtCanvas.tsx`
  - `src/test/art-generator-semantic.test.ts`
  - `src/test/art-generator-variation.test.ts`
  - `src/test/svg-art-canvas.test.ts`
  - `tasks/todo.md`
- Validation:
  - `npm test -- src/test/art-generator-semantic.test.ts`: pass
  - `npm test -- src/test/art-generator-variation.test.ts`: pass
  - `npm test -- src/test/svg-art-canvas.test.ts`: pass
  - `npm test`: pass (23/23)
  - `npx tsc --noEmit`: pass

# Mood Taxonomy Expansion (2026-02-25)

## Goal
Expand canonical moods from 9 to 15 to increase variation while preserving strict canonicalization and backward-compatible API behavior.

## Action Items
- [x] Add six new canonical moods to analyzer validation, defaults, hints, and prompt schema.
- [x] Add six new mood parameter mappings in generator with deterministic color/shape/dynamics ranges.
- [x] Update analyzer tests to accept the expanded canonical mood set.
- [x] Add semantic parser coverage for new canonical mood acceptance and unknown mood normalization fallback.
- [x] Add generator semantic smoke coverage for the six new moods with bounds assertions.
- [x] Add a dedicated plan doc at `tasks/mood-taxonomy-expansion-plan.md`.
- [x] Update README mood taxonomy documentation to the 15-mood set.
- [x] Run full test suite and capture results.

## Review
- Status: Implemented
- Files changed:
  - `src/lib/ai/semantic.ts`
  - `src/lib/art-generator/index.ts`
  - `src/test/mood-analyzer.test.ts`
  - `src/test/semantic.test.ts`
  - `src/test/art-generator-semantic.test.ts`
  - `README.md`
  - `tasks/mood-taxonomy-expansion-plan.md`
  - `tasks/todo.md`
- Validation:
  - `npm run test`: pass (26/26)

# Classic Algorithm Generation Upgrade (2026-02-25)

## Goal
Improve generation quality with curated palettes, noise-driven placement, and classic algorithmic renderers while preserving existing API/save compatibility.

## Action Items
- [x] Add curated palette catalog inspired by Coolors/Chromotome/GenerativePalettes.
- [x] Replace procedural HSL palette generation with deterministic curated palette selection.
- [x] Add deterministic 2D noise/fBm utility module for generator-side field params.
- [x] Extend `ArtParams` with additive algorithm/palette/noise/config fields.
- [x] Add deterministic algorithm selection by mood/semantic profile, including controlled variation behavior.
- [x] Add SVG algorithm renderer modules for:
  - [x] Flow field + particles
  - [x] Voronoi + gradients
  - [x] Delaunay + depth blur
  - [x] Particles + attractors
- [x] Refactor `SvgArtCanvas` into algorithm dispatcher with legacy fallback mode.
- [x] Update `/api/art/generate` debug payload with algorithm selection metadata.
- [x] Update homepage inspector to display algorithm/palette/noise diagnostics.
- [x] Add tests to validate curated palette + algorithm + noise assignment behavior.
- [x] Run full verification (`npm test`, `npx tsc --noEmit`, `npm run lint`).

## Review
- Status: Implemented
- Files changed:
  - `src/lib/art-generator/index.ts`
  - `src/lib/art-generator/palettes.ts`
  - `src/lib/art-generator/noise.ts`
  - `src/components/SvgArtCanvas.tsx`
  - `src/components/renderers/types.ts`
  - `src/components/renderers/utils.ts`
  - `src/components/renderers/flowFieldParticles.tsx`
  - `src/components/renderers/voronoiGradients.tsx`
  - `src/components/renderers/delaunayDepthBlur.tsx`
  - `src/components/renderers/particlesAttractors.tsx`
  - `src/app/api/art/generate/route.ts`
  - `src/app/page.tsx`
  - `src/test/art-generator-variation.test.ts`
  - `package.json`
  - `package-lock.json`
- Validation:
  - `npm test`: pass (27/27)
  - `npx tsc --noEmit`: pass
  - `npm run lint`: pass with one existing warning in `src/app/layout.tsx` (`@next/next/no-page-custom-font`)

# Curve Generation Optimization (2026-02-27)

## Goal
Upgrade legacy `curves` generation with deterministic flow-field/attractor strategies, depth-based styling, and curve diagnostics while keeping existing renderer modes unchanged.

## Action Items
- [x] Extend `ArtParams` with additive optional `curveConfig` controls and keep backward compatibility defaults.
- [x] Add reusable curve simulation/smoothing/depth mapping utilities in renderer utils.
- [x] Refactor legacy `curves` rendering into mode-based strategies (`legacy-bezier`, `topographical-flow`, `attractor-flow`).
- [x] Implement atmospheric curve depth styling for stroke width/opacity/color and depth-aware paint ordering.
- [x] Add static pulse dash styling (`subtle-pulse`) without runtime animation.
- [x] Add generator-side `curveConfig` generation + controlled variation and include `curveConfig` in option-distance/summary.
- [x] Update generation inspector to show curve mode/depth diagnostics.
- [x] Add tests for curve utility determinism/bounds/smoothing/depth and generator bounds/bias behavior.
- [x] Run validation (`npm test`, `npx tsc --noEmit`, `npm run lint`).

## Review
- Status: Implemented
- Files changed:
  - `src/components/SvgArtCanvas.tsx`
  - `src/components/renderers/utils.ts`
  - `src/lib/art-generator/index.ts`
  - `src/app/page.tsx`
  - `src/test/art-generator-variation.test.ts`
  - `src/test/svg-art-canvas.test.ts`
  - `src/test/curve-renderer-utils.test.ts`
  - `tasks/todo.md`
- Validation:
  - `npm test -- src/test/curve-renderer-utils.test.ts src/test/art-generator-variation.test.ts src/test/svg-art-canvas.test.ts`: pass
  - `npm test`: pass (32/32)
  - `npx tsc --noEmit`: pass
  - `npm run lint`: pass with one existing warning in `src/app/layout.tsx` (`@next/next/no-page-custom-font`)

# Remove Curves Shape (2026-02-27)

## Goal
Fully remove `curves` from the shape system (generation + rendering + tests) without legacy compatibility.

## Action Items
- [x] Remove `CurveConfig` and `curveConfig` from `ArtParams` in renderer and generator types.
- [x] Remove `curves` rendering branch and depth-sort logic from `SvgArtCanvas` legacy renderer.
- [x] Remove curve-only simulation/smoothing/depth helpers from renderer utils.
- [x] Remove all curve-related generation/variation/distance/summarization logic from art generator.
- [x] Remove `curves` entries from mood shape pools and semantic boost maps.
- [x] Remove curve diagnostics from homepage inspector.
- [x] Update tests to stop asserting curve presence and assert no `curves` output.
- [x] Delete curve-only test file.
- [x] Run full verification (`npm test`, `npx tsc --noEmit`, `npm run lint`).

## Review
- Status: Implemented
- Files changed:
  - `src/components/SvgArtCanvas.tsx`
  - `src/components/renderers/utils.ts`
  - `src/lib/art-generator/index.ts`
  - `src/app/page.tsx`
  - `src/test/art-generator-variation.test.ts`
  - `src/test/art-generate.test.ts`
  - `src/test/curve-renderer-utils.test.ts` (deleted)
  - `tasks/todo.md`
- Validation:
  - `npm test`: pass (27/27)
  - `npx tsc --noEmit`: pass
  - `npm run lint`: pass with one existing warning in `src/app/layout.tsx` (`@next/next/no-page-custom-font`)

# Layout/Shape Decoupling (2026-02-27)

## Goal
Decouple layout strategy from shape style so the same layout can combine with different shape outputs, while preserving backward compatibility for existing `renderAlgorithm` data.

## Action Items
- [x] Add additive `layoutAlgorithm` + `shapeStyle` fields to generator/canvas `ArtParams` types.
- [x] Keep `renderAlgorithm` as a backward-compatibility field and map between legacy/new fields.
- [x] Split generator selection into independent layout selection and shape-style selection logic.
- [x] Update variation distance/summary to account for layout and shape-style deltas.
- [x] Update renderer dispatcher to route by layout algorithm and let renderer output vary by shape style.
- [x] Update API debug payload and homepage inspector to expose decoupled fields.
- [x] Update/add tests for decoupled selection behavior and compatibility defaults.
- [x] Run verification tests.

## Review
- Status: Implemented
- Files changed:
  - `src/lib/art-generator/index.ts`
  - `src/components/SvgArtCanvas.tsx`
  - `src/components/renderers/flowFieldParticles.tsx`
  - `src/components/renderers/voronoiGradients.tsx`
  - `src/components/renderers/delaunayDepthBlur.tsx`
  - `src/components/renderers/particlesAttractors.tsx`
  - `src/app/api/art/generate/route.ts`
  - `src/app/page.tsx`
  - `src/test/art-generator-variation.test.ts`
  - `tasks/todo.md`
- Validation:
  - `npm test -- src/test/art-generator-variation.test.ts src/test/svg-art-canvas.test.ts src/test/art-generate.test.ts`: pass
  - `npx tsc --noEmit`: pass
  - `npm run lint`: pass with one existing warning in `src/app/layout.tsx` (`@next/next/no-page-custom-font`)
