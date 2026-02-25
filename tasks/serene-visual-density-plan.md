# Serene Visual Density Improvement Plan (2026-02-25)

## Problem Statement
For calm moods (especially `serene`), generated params can resolve to `complexity=1`. When the selected shape is `waves` and `layerCount=1`, rendering produces only one wave path, which is visually too sparse.

## Root Cause (Current Code)
- `createBaseParams` applies `complexityShift = Math.round((energy - 0.5) * 2)`, which can reduce calm outputs to 1.
- `enforceCleanComposition` allows complexity floor of 1 globally.
- `waves` rendering in `SvgArtCanvas` draws one path per complexity unit.
- The cleanliness budget optimizes for low clutter but currently has no minimum visual richness floor.

## Goals
- Preserve calm/clean aesthetics for `serene` and similar moods.
- Eliminate one-line/single-primitive outputs.
- Keep existing cleanliness constraints and API compatibility.
- Maintain deterministic behavior from seed + inputs.

## Non-Goals
- No redesign of mood taxonomy.
- No major rendering engine rewrite.
- No uncontrolled increase in chaos or motion.

## Implementation Plan
- [ ] Add a visual richness floor in generator output.
  - Introduce a composition floor policy in `src/lib/art-generator/index.ts`.
  - For calm moods (`serene`, `peaceful`, optionally `melancholic`), enforce `complexity >= 2` after all shifts.
  - Keep global clamp at `[1,10]` for other moods.

- [ ] Make density guard smarter than just lowering complexity.
  - Update `enforceCleanComposition` to degrade in this order when over budget:
    1. reduce `layerCount`,
    2. reduce `shapeTypes`,
    3. reduce complexity but never below mood floor.
  - Ensure calm moods do not collapse to `complexity=1` due to budget enforcement.

- [ ] Add shape-type minimum primitive rules in renderer.
  - In `src/components/SvgArtCanvas.tsx`, add per-shape minimum counts for low complexity cases.
  - For `waves`, render at least 2 wave paths when mood is calm or complexity is low.
  - For other line-based sparse modes, ensure minimum visible primitives (e.g., target >= 10 elements total across layers).

- [ ] Add a lightweight primitive estimator for QA/debug.
  - Add internal helper (generator-side or render helper) to estimate total drawn primitives.
  - Optionally expose estimate in debug metadata to inspect sparse outputs quickly.

- [ ] Keep option variation quality floors consistent.
  - Ensure `applyControlledVariation` + post-cleaning still respects minimum richness floors.
  - Prevent Option A/B from regressing into single-primitive variants.

## Verification Plan
- [ ] Add generator tests in `src/test/art-generator-semantic.test.ts`.
  - Case: low-energy `serene` semantic profile should still produce `complexity >= 2`.
  - Case: cleanliness enforcement should not violate calm mood complexity floor.

- [ ] Add renderer-focused tests (or pure helper tests) for primitive minimums.
  - `waves` with low complexity/layer should produce at least 2 wave paths.
  - Overall element count should meet baseline minimum for calm moods.

- [ ] Regression tests for high-density moods.
  - Verify `chaotic`/`intense` still obey upper cleanliness caps and do not overdraw.

- [ ] Manual validation matrix.
  - Sample prompts: `serene ocean`, `peaceful lake`, `melancholic rain`, `neutral sky`.
  - Generate multiple seeds and confirm no one-line output.

## Acceptance Criteria
- No `serene` artwork renders as a single line/path.
- Calm moods maintain a clean style while showing multi-element composition.
- Existing API response structure remains unchanged.
- Test suite passes with new floor and rendering expectations.

## Risks and Mitigations
- Risk: Over-correcting may make calm outputs too busy.
  - Mitigation: use low minimums (2+ waves, modest primitive floor) and keep chaos/motion unchanged.

- Risk: Strong floor may reduce option diversity.
  - Mitigation: apply floor after variation while preserving other varied fields (`shapeTypes`, `sizeCurve`, `positionBias`).

## Rollout Notes
- Start with generator floor + tests first.
- Then apply renderer minimum primitive safeguards.
- Re-run variation tests and visual spot checks before merging.
