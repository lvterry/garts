# Mood Taxonomy Expansion Plan (2026-02-25)

## Summary
Expand canonical moods from 9 to 15 to increase variation while keeping strict normalization and backward compatibility.

## Canonical Mood Set
Keep existing:
`serene, chaotic, joyful, melancholic, energetic, mysterious, peaceful, intense, neutral`

Add 6 new canonical moods:
`nostalgic, romantic, playful, ominous, ethereal, gritty`

## Public API / Interface Changes
- No route shape changes.
- `mood` and `semanticProfile.coreMood` remain `string` in TypeScript (no breaking type change).
- Runtime canonical set expands from 9 to 15 values.
- Strict canonicalization remains enforced:
  - Unknown mood from model output is normalized to inferred/fallback canonical mood.
  - No free-form mood values emitted to clients.

## File-by-File Implementation Plan
1. `src/lib/ai/semantic.ts`
- Extend `VALID_MOODS` with the 6 new moods.
- Extend `moodDefaults` with exact defaults:
  - nostalgic: `{ energy: 0.35, valence: 0.15, tempo: 'calm' }`
  - romantic: `{ energy: 0.45, valence: 0.65, tempo: 'medium' }`
  - playful: `{ energy: 0.78, valence: 0.72, tempo: 'fast' }`
  - ominous: `{ energy: 0.62, valence: -0.65, tempo: 'medium' }`
  - ethereal: `{ energy: 0.30, valence: 0.25, tempo: 'calm' }`
  - gritty: `{ energy: 0.70, valence: -0.25, tempo: 'fast' }`
- Extend `moodKeywordHints`:
  - nostalgic: `['vintage','memory','old','retro','sepia','nostalgia']`
  - romantic: `['romance','love','rose','candle','tender','intimate']`
  - playful: `['fun','play','whimsy','bouncy','toy','sparkle']`
  - ominous: `['ominous','dread','threat','eerie','foreboding','dark']`
  - ethereal: `['ethereal','misty','celestial','dreamlike','airy','halo']`
  - gritty: `['gritty','urban','raw','dust','rough','concrete']`
- Update `buildPrompt()` enum schema line to include all 15 moods exactly.
- Keep `normalizeMood`, parser fallback, and pipeline logic unchanged.

2. `src/lib/art-generator/index.ts`
- Add 6 entries to `moodToParams` with deterministic ranges and shape pools:
  - nostalgic: muted warm/cool mid tones, low-medium motion/chaos, waves+circles+curves.
  - romantic: warm pink/red hues, medium motion, circles+curves+spirals.
  - playful: high saturation bright palette, high motion, circles+spirals+triangles.
  - ominous: dark low-light palette, medium-high chaos, lines+triangles+waves.
  - ethereal: pale cool/lilac palette, low chaos, waves+curves+circles.
  - gritty: desaturated earth/steel palette, medium-high chaos, lines+triangles+curves.
- Keep all existing clamps/budgets and fallback to `neutral` unchanged.

3. `src/test/mood-analyzer.test.ts`
- Update `validMoods` list to include the 6 new canonical moods.
- Keep current behavior assertions intact.

4. `src/test/semantic.test.ts`
- Add case asserting parser accepts a new mood (for example `ethereal`) and preserves canonical value.
- Add case asserting unknown mood still normalizes to inferred canonical fallback.

5. `src/test/art-generator-semantic.test.ts`
- Add table-driven smoke test for all 6 new moods to ensure `generateArtParams(...)` returns:
  - non-empty `colors`, `backgroundColors`, `shapeTypes`
  - bounded numeric fields within global constraints
  - output `mood` equals input canonical mood

6. `README.md`
- Update mood list documentation examples to 15-mood set for consistency.

## Test Cases and Verification
1. Run `npm run test` and require pass.
2. Run focused tests if needed:
- `src/test/mood-analyzer.test.ts`
- `src/test/semantic.test.ts`
- `src/test/art-generator-semantic.test.ts`
3. Manual API spot checks via `/api/art/generate` keywords:
- “vintage postcard” -> likely `nostalgic`
- “candlelight love” -> likely `romantic`
- “toy confetti” -> likely `playful`
- “threatening stormfront” -> likely `ominous`
- “celestial mist” -> likely `ethereal`
- “raw concrete alley” -> likely `gritty`
4. Regression check:
- Existing moods still map and render without behavior breaks.
- Unknown LLM mood strings do not leak to response payload.

## Acceptance Criteria
- Canonical mood list is 15 across parser prompt, normalization, and analyzer tests.
- New moods generate distinct parameter profiles in generator mapping.
- Strict canonicalization is preserved.
- Test suite passes with no new failures.
- Existing API contract remains backward compatible.

## Risks and Mitigations
- Risk: New moods feel too close to existing ones.
- Mitigation: tune ranges to maximize separation in hue/saturation, chaos, and shape weighting.

- Risk: Model returns non-canonical synonyms.
- Mitigation: keep strict `normalizeMood` fallback and rich keyword hints.

## Assumptions and Defaults
- Chosen expansion scope is exactly +6 moods.
- Chosen compatibility mode is strict canonicalization.
- Plan file path is `tasks/mood-taxonomy-expansion-plan.md`.
- No database schema or API response schema changes are required.
