import type { SemanticProfile } from '@/lib/ai';
import { layoutToRenderAlgorithm } from '@/lib/art/layout';
import type { ArtParams, LayoutAlgorithm, ShapeStyle } from '@/lib/art/types';
import type { PaletteFamily } from '@/lib/art/types';
import { selectCuratedPalette } from '@/lib/art-generator/palettes';
import {
  CALM_MOOD_COMPLEXITY_FLOOR,
  imageryShapeBoosts,
  MAX_CHAOS_LEVEL,
  MAX_LAYER_COUNT,
  MAX_ROTATION_VARIANCE,
  MAX_SHAPE_TYPES,
  MAX_VISUAL_DENSITY,
  moodToParams,
  POSITION_OPTIONS,
  type ShapePoolItem,
  styleShapeBoosts,
} from '@/lib/art-generator/config';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeSeed(seed: number): number {
  return Math.abs(seed) % 1_000_000;
}

export function hashKeyword(keyword: string): number[] {
  let hash1 = 0;
  let hash2 = 0;
  let hash3 = 0;
  let hash4 = 0;
  let hash5 = 0;
  let hash6 = 0;

  for (let i = 0; i < keyword.length; i++) {
    const char = keyword.charCodeAt(i);
    hash1 = (hash1 << 5) - hash1 + char;
    hash2 = (hash2 << 7) - hash2 + char * 2;
    hash3 = (hash3 << 3) - hash3 + char * 3;
    hash4 = (hash4 << 11) - hash4 + char * 4;
    hash5 = (hash5 << 9) - hash5 + char * 5;
    hash6 = (hash6 << 13) - hash6 + char * 6;
  }

  return [
    Math.abs(hash1) % 1000,
    Math.abs(hash2) % 1000,
    Math.abs(hash3) % 1000,
    Math.abs(hash4) % 1000,
    Math.abs(hash5) % 1000,
    Math.abs(hash6) % 1000,
  ];
}

export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function randomInRange(seed: number, min: number, max: number): number {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
}

interface KeywordProperties {
  rotationVariance: number;
  sizeCurve: number;
  positionBias: ArtParams['positionBias'];
  strokeWidth: number;
  layerCount: number;
  shapeMixCount: number;
}

function getKeywordProperties(keyword: string): KeywordProperties {
  const [h1, h2, h3, h4, h5, h6] = hashKeyword(keyword);

  return {
    rotationVariance: h1 % 360,
    sizeCurve: (h2 % 100) / 100,
    positionBias: POSITION_OPTIONS[h3 % 3],
    strokeWidth: 1 + (h4 % 6),
    layerCount: 1 + (h5 % 3),
    shapeMixCount: 1 + (h6 % 3),
  };
}

function getSemanticScalars(semanticProfile?: SemanticProfile): {
  energy: number;
  valence: number;
  tempo: 'calm' | 'medium' | 'fast';
} {
  return {
    energy: clamp(semanticProfile?.energy ?? 0.5, 0, 1),
    valence: clamp(semanticProfile?.valence ?? 0, -1, 1),
    tempo: semanticProfile?.tempo ?? 'medium',
  };
}

export function getMoodComplexityFloor(mood: string): number {
  return CALM_MOOD_COMPLEXITY_FLOOR[mood.toLowerCase()] ?? 1;
}

export function enforceCleanComposition(params: ArtParams): ArtParams {
  let shapeTypes = params.shapeTypes.slice(0, MAX_SHAPE_TYPES);
  if (shapeTypes.length === 0) {
    shapeTypes = ['circles'];
  }

  const complexityFloor = getMoodComplexityFloor(params.mood);
  let layerCount = clamp(params.layerCount, 1, MAX_LAYER_COUNT);
  let complexity = clamp(params.complexity, complexityFloor, 10);

  while (shapeTypes.length * layerCount * complexity > MAX_VISUAL_DENSITY) {
    if (layerCount > 1) {
      layerCount -= 1;
      continue;
    }

    if (shapeTypes.length > 1) {
      shapeTypes = shapeTypes.slice(0, shapeTypes.length - 1);
      continue;
    }

    if (complexity > complexityFloor) {
      complexity -= 1;
      continue;
    }

    break;
  }

  return {
    ...params,
    shapeTypes,
    layerCount,
    complexity,
    chaosLevel: clamp(params.chaosLevel, 1, MAX_CHAOS_LEVEL),
    rotationVariance: clamp(params.rotationVariance, 0, MAX_ROTATION_VARIANCE),
  };
}

export function buildSemanticShapePool(
  basePool: ShapePoolItem[],
  semanticProfile?: SemanticProfile
): ShapePoolItem[] {
  if (!semanticProfile) {
    return basePool;
  }

  const boosts = new Map<string, number>();
  const hints = [
    ...semanticProfile.styleHints.map((hint) => hint.toLowerCase()),
    ...semanticProfile.imageryTags.map((tag) => tag.toLowerCase()),
  ];

  for (const hint of hints) {
    for (const shape of styleShapeBoosts[hint] ?? []) {
      boosts.set(shape, (boosts.get(shape) ?? 0) + 0.2);
    }
    for (const shape of imageryShapeBoosts[hint] ?? []) {
      boosts.set(shape, (boosts.get(shape) ?? 0) + 0.15);
    }
  }

  return basePool.map((item) => ({
    ...item,
    weight: item.weight + (boosts.get(item.type) ?? 0),
  }));
}

export function selectShapeTypes(
  shapePool: ShapePoolItem[],
  count: number,
  selectionSeed: number
): string[] {
  const selected: string[] = [];
  const available = shapePool.map((item) => ({ ...item }));

  for (let i = 0; i < count && available.length > 0; i++) {
    const totalWeight = available.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) {
      break;
    }

    let random = seededRandom(selectionSeed + i * 17 + 1) * totalWeight;
    let selectedIndex = available.length - 1;

    for (let j = 0; j < available.length; j++) {
      random -= available[j].weight;
      if (random <= 0) {
        selectedIndex = j;
        break;
      }
    }

    selected.push(available[selectedIndex].type);
    available.splice(selectedIndex, 1);
  }

  return selected;
}

export function selectLayoutAlgorithm(
  mood: string,
  semanticProfile: SemanticProfile | undefined,
  seed: number,
  optionIndex: number
): LayoutAlgorithm {
  const normalizedMood = mood.toLowerCase();
  const energy = clamp(semanticProfile?.energy ?? 0.5, 0, 1);
  const calmSet = new Set(['serene', 'peaceful', 'ethereal', 'melancholic']);
  const intenseSet = new Set(['chaotic', 'intense', 'energetic', 'ominous']);

  let preferred: LayoutAlgorithm[];
  if (calmSet.has(normalizedMood) || energy < 0.38) {
    preferred = ['voronoi', 'flow-field', 'attractors', 'delaunay'];
  } else if (intenseSet.has(normalizedMood) || energy > 0.72) {
    preferred = ['delaunay', 'attractors', 'flow-field', 'voronoi'];
  } else {
    preferred = ['flow-field', 'voronoi', 'attractors', 'delaunay'];
  }

  const pick = Math.floor(seededRandom(seed + optionIndex * 43) * preferred.length);
  return preferred[pick] ?? preferred[0];
}

export function selectShapeStyle(
  mood: string,
  semanticProfile: SemanticProfile | undefined,
  seed: number,
  optionIndex: number,
  layout: LayoutAlgorithm
): ShapeStyle {
  const normalizedMood = mood.toLowerCase();
  const energy = clamp(semanticProfile?.energy ?? 0.5, 0, 1);
  const calmSet = new Set(['serene', 'peaceful', 'ethereal', 'melancholic']);
  const intenseSet = new Set(['chaotic', 'intense', 'energetic', 'ominous']);

  let preferred: ShapeStyle[];
  if (layout === 'voronoi' || layout === 'delaunay') {
    preferred = ['mesh', 'linework', 'point-cloud'];
  } else if (layout === 'flow-field' || layout === 'attractors') {
    preferred = ['linework', 'point-cloud', 'mesh'];
  } else {
    preferred = ['linework', 'mesh', 'point-cloud'];
  }

  if (calmSet.has(normalizedMood) || energy < 0.38) {
    preferred = [...preferred].sort((a, b) => (a === 'mesh' ? -1 : 0) - (b === 'mesh' ? -1 : 0));
  } else if (intenseSet.has(normalizedMood) || energy > 0.72) {
    preferred = [...preferred].sort((a, b) => (a === 'linework' ? -1 : 0) - (b === 'linework' ? -1 : 0));
  }

  const pick = Math.floor(seededRandom(seed + optionIndex * 59 + 7) * preferred.length);
  return preferred[pick] ?? preferred[0];
}

export function buildNoisePlacement(
  seed: number,
  energy: number,
  complexity: number,
  optionIndex: number
): NonNullable<ArtParams['noisePlacement']> {
  const detailBoost = complexity / 10;
  return {
    scale: Number((0.004 + seededRandom(seed + 501) * 0.01 + detailBoost * 0.002).toFixed(4)),
    strength: Number((0.7 + energy * 1.1 + optionIndex * 0.08).toFixed(2)),
    octaves: clamp(2 + Math.round(energy * 2 + complexity / 5), 2, 6),
    lacunarity: Number((1.8 + seededRandom(seed + 502) * 1.1).toFixed(2)),
    gain: Number((0.38 + seededRandom(seed + 503) * 0.28).toFixed(2)),
  };
}

export function buildAlgorithmConfig(
  seed: number,
  complexity: number,
  energy: number
): NonNullable<ArtParams['algorithmConfig']> {
  return {
    particleCount: clamp(Math.round(70 + complexity * 16 + energy * 85 + seededRandom(seed + 511) * 20), 70, 260),
    stepCount: clamp(Math.round(20 + complexity * 3 + energy * 8 + seededRandom(seed + 512) * 6), 20, 72),
    siteCount: clamp(Math.round(24 + complexity * 7 + seededRandom(seed + 513) * 10), 24, 120),
    attractorCount: clamp(Math.round(2 + energy * 3 + seededRandom(seed + 514) * 2), 2, 7),
    blurLayers: clamp(Math.round(2 + energy * 2 + seededRandom(seed + 515)), 2, 5),
  };
}

function generateColorPalette(
  mood: string,
  keyword: string,
  seed: number,
  semanticProfile?: SemanticProfile
): { shapeColors: string[]; backgroundColors: string[]; paletteId: string; paletteFamily: PaletteFamily } {
  const { valence } = getSemanticScalars(semanticProfile);
  const baseSeed = hashKeyword(keyword).reduce((a, b) => a + b, 0) + seed;
  const imageryTags = semanticProfile?.imageryTags ?? [];

  return selectCuratedPalette({
    mood,
    seed: baseSeed,
    valence,
    imageryTags,
  });
}

export function createBaseParams(
  mood: string,
  keyword: string | undefined,
  semanticProfile: SemanticProfile | undefined,
  seed: number
): ArtParams {
  const normalizedMood = mood.toLowerCase();
  const moodData = moodToParams[normalizedMood] || moodToParams.neutral;
  const { energy, valence, tempo } = getSemanticScalars(semanticProfile);
  const keywordText = keyword || '';

  const kwProps = keyword
    ? getKeywordProperties(keyword)
    : {
        rotationVariance: 45,
        sizeCurve: 0.5,
        positionBias: 'uniform' as const,
        strokeWidth: 2,
        layerCount: 1,
        shapeMixCount: 1,
      };

  const hashSeed = keyword ? hashKeyword(keyword).reduce((a, b) => a + b, 0) : seed;
  const shapeCountBoost = energy > 0.72 ? 1 : 0;
  const shapeCount = clamp(kwProps.shapeMixCount + shapeCountBoost, 1, 3);
  const weightedShapePool = buildSemanticShapePool(moodData.shapePool, semanticProfile);
  const shapeTypes = selectShapeTypes(weightedShapePool, shapeCount, hashSeed + seed * 3 + 19);

  const { shapeColors, backgroundColors, paletteId, paletteFamily } = generateColorPalette(
    normalizedMood,
    keywordText,
    seed,
    semanticProfile
  );

  const tempoBoost = tempo === 'fast' ? 1.1 : tempo === 'calm' ? 0.9 : 1;
  const complexityShift = Math.round((energy - 0.5) * 2);
  const chaosShift = Math.round((energy - 0.5) * 3 - valence * 1.2);
  const baseComplexity = clamp(
    randomInRange(hashSeed + 100, moodData.complexity[0], moodData.complexity[1]) + complexityShift,
    1,
    10
  );
  const baseMotionSpeed = clamp(
    Math.round(randomInRange(hashSeed + 200, moodData.motionSpeed[0], moodData.motionSpeed[1]) * tempoBoost),
    1,
    10
  );
  const layoutAlgorithm = selectLayoutAlgorithm(normalizedMood, semanticProfile, seed + hashSeed, 0);
  const shapeStyle = selectShapeStyle(normalizedMood, semanticProfile, seed + hashSeed, 0, layoutAlgorithm);

  const baseParams: ArtParams = {
    seed,
    mood: normalizedMood,
    colors: shapeColors,
    backgroundColors,
    shapeTypes,
    complexity: baseComplexity,
    motionSpeed: baseMotionSpeed,
    chaosLevel: clamp(
      randomInRange(hashSeed + 300, moodData.chaosLevel[0], moodData.chaosLevel[1]) + chaosShift,
      1,
      10
    ),
    rotationVariance: clamp(kwProps.rotationVariance + Math.round(energy * 25 - valence * 10), 0, 359),
    sizeCurve: kwProps.sizeCurve,
    positionBias: kwProps.positionBias,
    strokeWidth: clamp(kwProps.strokeWidth + (energy > 0.8 ? 1 : 0), 1, 7),
    layerCount: kwProps.layerCount,
    renderAlgorithm: layoutToRenderAlgorithm(layoutAlgorithm),
    layoutAlgorithm,
    shapeStyle,
    paletteId,
    paletteFamily,
    noisePlacement: buildNoisePlacement(seed + 271, energy, baseComplexity, 0),
    algorithmConfig: buildAlgorithmConfig(seed + 331, baseComplexity, energy),
  };

  const cleanedParams = enforceCleanComposition(baseParams);
  return {
    ...cleanedParams,
    complexity: Math.max(cleanedParams.complexity, getMoodComplexityFloor(normalizedMood)),
  };
}
