# Plan: Algorithmic Generation Upgrade (Curated Palettes + Noise Placement + 4 Classic Systems)

## Summary
Upgrade the current SVG generator to produce more intentional, varied compositions by:
1. replacing procedural HSL palettes with a curated palette catalog inspired by Coolors/Chromotome/GenerativePalettes,
2. making placement and motion noise-field-driven,
3. adding four deterministic classic algorithm renderers:
   - Flow Field + Particles
   - Voronoi + Gradients
   - Delaunay + Depth Blur
   - Particles + Attractors

Locked decisions:
- Renderer target: SVG only.
- Option routing: automatic algorithm mix by mood/semantic profile (no manual picker in this iteration).

## Current-State Anchors
- Generator params and variation logic: `src/lib/art-generator/index.ts`
- Rendering: `src/components/SvgArtCanvas.tsx`
- API contract: `src/app/api/art/generate/route.ts`
- UI inspector: `src/app/page.tsx`

## Public API / Type Changes
1. Extend `ArtParams` in generator + canvas with additive fields:
- `renderAlgorithm: 'flow-field-particles' | 'voronoi-gradients' | 'delaunay-depth-blur' | 'particles-attractors' | 'legacy-shapes'`
- `paletteId: string`
- `paletteFamily: 'coolors-inspired' | 'chromotome-inspired' | 'generativepalettes-inspired'`
- `noisePlacement: { scale: number; strength: number; octaves: number; lacunarity: number; gain: number }`
- `algorithmConfig: { particleCount?: number; stepCount?: number; siteCount?: number; attractorCount?: number; blurLayers?: number }`

2. Keep backward compatibility:
- Existing saved artworks lacking new fields render via `legacy-shapes`.
- `/api/art/generate` request shape unchanged.
- Response remains additive via expanded `artParams` and optional `debug.algorithmSelection`.

3. Update option-distance metric to include `renderAlgorithm`, `paletteId`, and noise profile deltas so A/B separation remains meaningful.

## Implementation Plan (Decision Complete)
1. Documentation-first task tracking
- In implementation mode, first update `tasks/todo.md` with checklist + review section for this upgrade (per repo process).

2. Palette system
- Add `src/lib/art-generator/palettes.ts` with a static curated catalog (manually curated entries, no runtime scraping).
- Each palette record includes: `id`, `name`, `family`, `tags`, `moods`, `colors`, `background`.
- Replace `generateColorPalette` internals with deterministic palette selection:
  - seed key = keyword hash + option seed + semantic mood/valence bucket.
  - choose family by weighted mood mapping, then choose palette index deterministically.
  - derive `colors/backgroundColors` by palette rotation/shuffle rules to keep deterministic variety.

3. Noise utility layer
- Add `src/lib/art-generator/noise.ts` with deterministic 2D value/fractal noise helpers (`noise2D`, `fbm2D`) seeded from `ArtParams.seed`.
- Replace random-offset placement usage with noise field sampling for position perturbation and trajectory drift.

4. Algorithm selection and params generation
- In generator, add deterministic `selectRenderAlgorithm(mood, semanticProfile, variationContext)`:
  - calm/ethereal/peaceful bias -> `voronoi-gradients` / `flow-field-particles`
  - energetic/chaotic/intense bias -> `delaunay-depth-blur` / `particles-attractors`
  - ensure Option B can diverge algorithm when distance is too low.
- Generate `noisePlacement` and `algorithmConfig` bounds from mood energy and complexity.

5. SVG renderer modularization
- Split renderer internals into algorithm modules:
  - `src/components/renderers/flowFieldParticles.ts`
  - `src/components/renderers/voronoiGradients.ts`
  - `src/components/renderers/delaunayDepthBlur.ts`
  - `src/components/renderers/particlesAttractors.ts`
- `SvgArtCanvas` becomes dispatcher:
  - route by `renderAlgorithm`,
  - define shared `<defs>` for gradients/blur filters,
  - fallback to existing shape renderer for `legacy-shapes` or missing fields.

6. Algorithm specifics
- Flow Field + Particles:
  - build vector field from `fbm2D`,
  - advect particles for `stepCount`,
  - render thin polylines with palette gradient stroke and alpha taper.
- Voronoi + Gradients:
  - generate noise-jittered sites,
  - compute Voronoi cells,
  - fill cells using local gradient orientation from field angle.
- Delaunay + Depth Blur:
  - triangulate points,
  - assign depth via noise,
  - bucket triangles into `blurLayers` and apply increasing Gaussian blur with lower opacity.
- Particles + Attractors:
  - spawn attractor points from seeded noise maxima,
  - integrate particles with attractor force + damping + noise drift,
  - render trails with additive-like layering (via opacity/stroke stacking in SVG).

7. UI inspector updates
- Add inspector rows in `src/app/page.tsx` for:
  - algorithm,
  - palette id/family,
  - noise settings summary.
- Keep current Option A/B UX unchanged.

8. Optional dependency
- Add `d3-delaunay` for robust Voronoi/Delaunay computation (preferred over custom geometry implementation for correctness/time).

## Tests and Scenarios
1. Generator tests
- deterministic output for same keyword/mood/context includes same algorithm/palette.
- `renderAlgorithm` always in allowed enum.
- `paletteId` exists in catalog.
- `noisePlacement` and `algorithmConfig` remain within defined bounds.
- option-distance reflects algorithm/palette differences.

2. API tests
- `/api/art/generate` still returns `artParams` and `options`.
- new fields are present in each option’s `artParams`.
- backward compatibility: `artParams === options[0].artParams` remains true.

3. Renderer tests
- each algorithm path returns non-empty SVG elements for valid params.
- `legacy-shapes` still works for old saved payloads.
- no runtime crash when optional new fields are absent.

4. Manual acceptance
- Generate 10 varied prompts; confirm all 4 algorithms appear across runs.
- Option A/B visually diverges while mood remains semantically aligned.
- Save/open in gallery still renders correctly.

## Assumptions and Defaults
- No runtime fetching from palette source sites; curated data is embedded locally with inspiration attribution in comments/docs.
- SVG remains the only render backend in this iteration.
- Manual algorithm picker is out of scope; auto-selection only.
- Existing cleanliness constraints remain, but interpreted per algorithm via config caps instead of only shape-count caps.
- If triangulation dependency integration fails, fallback is to ship Flow/Voronoi/Attractor first and gate Delaunay behind feature flag in the same schema.
