import type { SemanticProfile } from '@/lib/ai';
import { layoutToRenderAlgorithm, resolveLayoutAlgorithm, resolveShapeStyle } from '@/lib/art/layout';
import type { ArtParams, VariationContext } from '@/lib/art/types';
import { selectCuratedPalette } from '@/lib/art-generator/palettes';
import {
  buildAlgorithmConfig,
  buildNoisePlacement,
  buildSemanticShapePool,
  clamp,
  enforceCleanComposition,
  hashKeyword,
  normalizeSeed,
  seededRandom,
  selectLayoutAlgorithm,
  selectShapeStyle,
  selectShapeTypes,
} from '@/lib/art-generator/base';
import { moodToParams, OPTION_STRENGTH_PRESETS, POSITION_OPTIONS } from '@/lib/art-generator/config';

function resolveVariationStrength(variationContext?: VariationContext): number {
  if (!variationContext) {
    return 0;
  }

  if (typeof variationContext.strength === 'number') {
    return clamp(variationContext.strength, 0, 1);
  }

  const index = clamp(variationContext.optionIndex, 0, OPTION_STRENGTH_PRESETS.length - 1);
  return OPTION_STRENGTH_PRESETS[index];
}

function buildVariationSeed(hashSeed: number, variationContext: VariationContext): number {
  const seed = variationContext.baseSeed * 31 + hashSeed * 17 + variationContext.optionIndex * 997;
  return normalizeSeed(seed);
}

function buildVariationShapePool(
  shapePool: Array<{ type: string; weight: number }>,
  variationSeed: number,
  strength: number,
  optionIndex: number
): Array<{ type: string; weight: number }> {
  if (strength <= 0) {
    return shapePool;
  }

  const directionalBias = optionIndex === 0 ? -0.2 : 0.2;

  return shapePool.map((item, idx) => {
    const noise = seededRandom(variationSeed + idx * 23 + 701) * 2 - 1;
    const scale = 1 + noise * strength * 0.6 + directionalBias * strength;
    return {
      ...item,
      weight: Math.max(0.05, item.weight * scale),
    };
  });
}

function varyInt(
  base: number,
  min: number,
  max: number,
  variationSeed: number,
  offset: number,
  strength: number,
  optionIndex: number,
  amplitude: number
): number {
  if (strength <= 0) {
    return clamp(base, min, max);
  }

  const jitter = seededRandom(variationSeed + offset) * 2 - 1;
  const directionalBias = optionIndex === 0 ? -0.35 : 0.35;
  const rawDelta = (jitter * 0.65 + directionalBias) * amplitude * strength;

  return clamp(base + Math.round(rawDelta), min, max);
}

function varyFloat(
  base: number,
  min: number,
  max: number,
  variationSeed: number,
  offset: number,
  strength: number,
  optionIndex: number,
  amplitude: number
): number {
  if (strength <= 0) {
    return clamp(base, min, max);
  }

  const jitter = seededRandom(variationSeed + offset) * 2 - 1;
  const directionalBias = optionIndex === 0 ? -0.3 : 0.3;
  const delta = (jitter * 0.7 + directionalBias) * amplitude * strength;
  return clamp(base + delta, min, max);
}

function varyPositionBias(
  base: ArtParams['positionBias'],
  variationSeed: number,
  strength: number
): ArtParams['positionBias'] {
  if (strength < 0.35 || seededRandom(variationSeed + 808) < 0.25) {
    return base;
  }

  const alternatives = POSITION_OPTIONS.filter((option) => option !== base);
  const selectedIdx = Math.floor(seededRandom(variationSeed + 809) * alternatives.length);
  return alternatives[selectedIdx] ?? base;
}

export function resolveSeed(keyword: string | undefined, variationContext?: VariationContext): number {
  if (!variationContext) {
    return Math.floor(Math.random() * 1000000);
  }

  const keywordSeed = keyword ? hashKeyword(keyword).reduce((a, b) => a + b, 0) : 0;
  const derived = variationContext.baseSeed * 13 + (variationContext.optionIndex + 1) * 7919 + keywordSeed * 7;
  return normalizeSeed(derived);
}

export function applyControlledVariation(
  baseParams: ArtParams,
  keyword: string | undefined,
  semanticProfile: SemanticProfile | undefined,
  variationContext: VariationContext
): ArtParams {
  const strength = resolveVariationStrength(variationContext);
  if (strength <= 0) {
    return baseParams;
  }

  const keywordHashSeed = keyword ? hashKeyword(keyword).reduce((a, b) => a + b, 0) : baseParams.seed;
  const variationSeed = buildVariationSeed(keywordHashSeed, variationContext);
  const moodData = moodToParams[baseParams.mood] || moodToParams.neutral;

  const shapePool = buildSemanticShapePool(moodData.shapePool, semanticProfile);
  const variedShapePool = buildVariationShapePool(shapePool, variationSeed, strength, variationContext.optionIndex);

  const shapeCount = clamp(
    baseParams.shapeTypes.length + (strength > 0.65 ? 1 : 0) - (variationContext.optionIndex === 0 ? 1 : 0),
    1,
    3
  );
  const variedComplexity = varyInt(
    baseParams.complexity,
    1,
    10,
    variationSeed,
    101,
    strength,
    variationContext.optionIndex,
    5
  );

  const baseLayout = resolveLayoutAlgorithm(baseParams);
  const baseShapeStyle = resolveShapeStyle(baseParams.shapeStyle, baseLayout);
  const variedLayout =
    strength > 0.45
      ? selectLayoutAlgorithm(baseParams.mood, semanticProfile, variationSeed + 991, variationContext.optionIndex)
      : baseLayout;
  const variedShapeStyle =
    strength > 0.35
      ? selectShapeStyle(baseParams.mood, semanticProfile, variationSeed + 1111, variationContext.optionIndex, variedLayout)
      : baseShapeStyle;

  const valence = semanticProfile?.valence ?? 0;
  const variedPalette = selectCuratedPalette({
    mood: baseParams.mood,
    seed: variationSeed + 1401 + variationContext.optionIndex * 97,
    valence,
    imageryTags: semanticProfile?.imageryTags ?? [],
  });

  const variedMotionSpeed = varyInt(
    baseParams.motionSpeed,
    1,
    10,
    variationSeed,
    202,
    strength,
    variationContext.optionIndex,
    5
  );

  const variedParams: ArtParams = {
    ...baseParams,
    shapeTypes: selectShapeTypes(variedShapePool, shapeCount, variationSeed + 631),
    complexity: variedComplexity,
    motionSpeed: variedMotionSpeed,
    chaosLevel: varyInt(baseParams.chaosLevel, 1, 10, variationSeed, 303, strength, variationContext.optionIndex, 6),
    rotationVariance: varyInt(
      baseParams.rotationVariance,
      0,
      359,
      variationSeed,
      404,
      strength,
      variationContext.optionIndex,
      150
    ),
    sizeCurve: Number(varyFloat(baseParams.sizeCurve, 0, 1, variationSeed, 505, strength, variationContext.optionIndex, 0.45).toFixed(2)),
    positionBias: varyPositionBias(baseParams.positionBias, variationSeed, strength),
    strokeWidth: varyInt(baseParams.strokeWidth, 1, 7, variationSeed, 606, strength, variationContext.optionIndex, 3),
    layerCount: varyInt(baseParams.layerCount, 1, 3, variationSeed, 707, strength, variationContext.optionIndex, 2),
    renderAlgorithm: layoutToRenderAlgorithm(variedLayout),
    layoutAlgorithm: variedLayout,
    shapeStyle: variedShapeStyle,
    paletteId: variedPalette.paletteId,
    paletteFamily: variedPalette.paletteFamily,
    colors: variedPalette.shapeColors,
    backgroundColors: variedPalette.backgroundColors,
    noisePlacement: buildNoisePlacement(
      variationSeed + 1501,
      clamp((semanticProfile?.energy ?? 0.5) + strength * 0.15, 0, 1),
      variedComplexity,
      variationContext.optionIndex
    ),
    algorithmConfig: buildAlgorithmConfig(
      variationSeed + 1601,
      variedComplexity,
      clamp((semanticProfile?.energy ?? 0.5) + strength * 0.2, 0, 1)
    ),
  };

  return enforceCleanComposition(variedParams);
}
