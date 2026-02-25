import { SemanticProfile } from '@/lib/ai';
import { PaletteFamily, selectCuratedPalette } from '@/lib/art-generator/palettes';

export interface ArtParams {
  seed: number;
  mood: string;
  colors: string[];
  backgroundColors: string[];
  shapeTypes: string[];
  complexity: number;
  motionSpeed: number;
  chaosLevel: number;
  rotationVariance: number;
  sizeCurve: number;
  positionBias: 'center' | 'edge' | 'uniform';
  strokeWidth: number;
  layerCount: number;
  renderAlgorithm?:
    | 'flow-field-particles'
    | 'voronoi-gradients'
    | 'delaunay-depth-blur'
    | 'particles-attractors'
    | 'legacy-shapes';
  paletteId?: string;
  paletteFamily?: PaletteFamily;
  noisePlacement?: {
    scale: number;
    strength: number;
    octaves: number;
    lacunarity: number;
    gain: number;
  };
  algorithmConfig?: {
    particleCount?: number;
    stepCount?: number;
    siteCount?: number;
    attractorCount?: number;
    blurLayers?: number;
  };
}

export interface VariationContext {
  optionIndex: number;
  optionCount: number;
  baseSeed: number;
  mode: 'compare-controlled';
  strength?: number;
}

interface ColorRanges {
  h: [number, number];
  s: [number, number];
  l: [number, number];
}

interface ShapePoolItem {
  type: string;
  weight: number;
}

interface MoodParams {
  colorRanges: ColorRanges;
  bgColorRanges: ColorRanges;
  shapePool: ShapePoolItem[];
  complexity: [number, number];
  motionSpeed: [number, number];
  chaosLevel: [number, number];
}

const OPTION_STRENGTH_PRESETS = [0.25, 0.55, 0.75, 0.9];
const POSITION_OPTIONS: ArtParams['positionBias'][] = ['center', 'edge', 'uniform'];
const MAX_VISUAL_DENSITY = 14;
const MAX_SHAPE_TYPES = 2;
const MAX_LAYER_COUNT = 2;
const MAX_CHAOS_LEVEL = 6;
const MAX_ROTATION_VARIANCE = 220;
const CALM_MOOD_COMPLEXITY_FLOOR: Record<string, number> = {
  serene: 2,
  peaceful: 2,
  melancholic: 2,
};
const RENDER_ALGORITHMS: Array<NonNullable<ArtParams['renderAlgorithm']>> = [
  'flow-field-particles',
  'voronoi-gradients',
  'delaunay-depth-blur',
  'particles-attractors',
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeSeed(seed: number): number {
  return Math.abs(seed) % 1_000_000;
}

function ensureRenderAlgorithm(value: ArtParams['renderAlgorithm']): NonNullable<ArtParams['renderAlgorithm']> {
  return value && RENDER_ALGORITHMS.includes(value) ? value : 'legacy-shapes';
}

function selectRenderAlgorithm(
  mood: string,
  semanticProfile: SemanticProfile | undefined,
  seed: number,
  optionIndex: number
): NonNullable<ArtParams['renderAlgorithm']> {
  const normalizedMood = mood.toLowerCase();
  const energy = clamp(semanticProfile?.energy ?? 0.5, 0, 1);
  const calmSet = new Set(['serene', 'peaceful', 'ethereal', 'melancholic']);
  const intenseSet = new Set(['chaotic', 'intense', 'energetic', 'ominous']);

  let preferred: Array<NonNullable<ArtParams['renderAlgorithm']>>;
  if (calmSet.has(normalizedMood) || energy < 0.38) {
    preferred = ['voronoi-gradients', 'flow-field-particles', 'particles-attractors', 'delaunay-depth-blur'];
  } else if (intenseSet.has(normalizedMood) || energy > 0.72) {
    preferred = ['delaunay-depth-blur', 'particles-attractors', 'flow-field-particles', 'voronoi-gradients'];
  } else {
    preferred = ['flow-field-particles', 'voronoi-gradients', 'particles-attractors', 'delaunay-depth-blur'];
  }

  const pick = Math.floor(seededRandom(seed + optionIndex * 43) * preferred.length);
  return preferred[pick] ?? preferred[0];
}

function buildNoisePlacement(
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

function buildAlgorithmConfig(
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

const moodToParams: Record<string, MoodParams> = {
  serene: {
    colorRanges: { h: [180, 220], s: [40, 70], l: [60, 85] },
    bgColorRanges: { h: [200, 240], s: [20, 50], l: [12, 22] },
    shapePool: [
      { type: 'circles', weight: 0.4 },
      { type: 'waves', weight: 0.25 },
      { type: 'spirals', weight: 0.15 },
      { type: 'curves', weight: 0.2 },
    ],
    complexity: [2, 4],
    motionSpeed: [1, 3],
    chaosLevel: [1, 3],
  },
  chaotic: {
    colorRanges: { h: [0, 60], s: [70, 100], l: [55, 80] },
    bgColorRanges: { h: [0, 30], s: [40, 70], l: [10, 20] },
    shapePool: [
      { type: 'triangles', weight: 0.6 },
      { type: 'lines', weight: 0.4 },
    ],
    complexity: [7, 10],
    motionSpeed: [7, 10],
    chaosLevel: [7, 10],
  },
  joyful: {
    colorRanges: { h: [30, 90], s: [60, 90], l: [60, 80] },
    bgColorRanges: { h: [20, 60], s: [30, 60], l: [15, 25] },
    shapePool: [
      { type: 'spirals', weight: 0.4 },
      { type: 'circles', weight: 0.35 },
      { type: 'triangles', weight: 0.25 },
    ],
    complexity: [5, 7],
    motionSpeed: [5, 8],
    chaosLevel: [4, 6],
  },
  melancholic: {
    colorRanges: { h: [200, 240], s: [20, 40], l: [40, 60] },
    bgColorRanges: { h: [220, 260], s: [15, 35], l: [8, 18] },
    shapePool: [
      { type: 'waves', weight: 0.4 },
      { type: 'circles', weight: 0.2 },
      { type: 'lines', weight: 0.15 },
      { type: 'curves', weight: 0.25 },
    ],
    complexity: [3, 5],
    motionSpeed: [1, 3],
    chaosLevel: [2, 4],
  },
  energetic: {
    colorRanges: { h: [10, 50], s: [80, 100], l: [55, 75] },
    bgColorRanges: { h: [10, 40], s: [40, 70], l: [12, 22] },
    shapePool: [
      { type: 'lines', weight: 0.5 },
      { type: 'triangles', weight: 0.35 },
      { type: 'spirals', weight: 0.15 },
    ],
    complexity: [6, 9],
    motionSpeed: [8, 10],
    chaosLevel: [6, 9],
  },
  mysterious: {
    colorRanges: { h: [260, 310], s: [50, 80], l: [45, 65] },
    bgColorRanges: { h: [270, 320], s: [30, 60], l: [8, 18] },
    shapePool: [
      { type: 'circles', weight: 0.3 },
      { type: 'waves', weight: 0.2 },
      { type: 'spirals', weight: 0.3 },
      { type: 'curves', weight: 0.2 },
    ],
    complexity: [4, 6],
    motionSpeed: [2, 4],
    chaosLevel: [3, 5],
  },
  peaceful: {
    colorRanges: { h: [90, 150], s: [35, 60], l: [55, 75] },
    bgColorRanges: { h: [100, 160], s: [20, 45], l: [12, 22] },
    shapePool: [
      { type: 'waves', weight: 0.35 },
      { type: 'circles', weight: 0.25 },
      { type: 'spirals', weight: 0.2 },
      { type: 'curves', weight: 0.2 },
    ],
    complexity: [2, 4],
    motionSpeed: [1, 3],
    chaosLevel: [1, 3],
  },
  intense: {
    colorRanges: { h: [280, 340], s: [60, 90], l: [45, 65] },
    bgColorRanges: { h: [290, 340], s: [40, 70], l: [8, 18] },
    shapePool: [
      { type: 'triangles', weight: 0.5 },
      { type: 'lines', weight: 0.3 },
      { type: 'circles', weight: 0.2 },
    ],
    complexity: [8, 10],
    motionSpeed: [7, 10],
    chaosLevel: [8, 10],
  },
  nostalgic: {
    colorRanges: { h: [24, 220], s: [28, 52], l: [45, 68] },
    bgColorRanges: { h: [18, 230], s: [14, 36], l: [10, 20] },
    shapePool: [
      { type: 'waves', weight: 0.38 },
      { type: 'circles', weight: 0.34 },
      { type: 'curves', weight: 0.28 },
    ],
    complexity: [3, 5],
    motionSpeed: [2, 4],
    chaosLevel: [2, 4],
  },
  romantic: {
    colorRanges: { h: [330, 359], s: [58, 86], l: [52, 76] },
    bgColorRanges: { h: [320, 359], s: [24, 52], l: [10, 20] },
    shapePool: [
      { type: 'circles', weight: 0.4 },
      { type: 'curves', weight: 0.34 },
      { type: 'spirals', weight: 0.26 },
    ],
    complexity: [4, 6],
    motionSpeed: [3, 5],
    chaosLevel: [2, 4],
  },
  playful: {
    colorRanges: { h: [18, 180], s: [78, 100], l: [58, 82] },
    bgColorRanges: { h: [10, 170], s: [36, 62], l: [12, 22] },
    shapePool: [
      { type: 'circles', weight: 0.36 },
      { type: 'spirals', weight: 0.34 },
      { type: 'triangles', weight: 0.3 },
    ],
    complexity: [6, 8],
    motionSpeed: [6, 9],
    chaosLevel: [4, 6],
  },
  ominous: {
    colorRanges: { h: [220, 320], s: [30, 64], l: [28, 52] },
    bgColorRanges: { h: [220, 320], s: [14, 36], l: [6, 14] },
    shapePool: [
      { type: 'lines', weight: 0.42 },
      { type: 'triangles', weight: 0.33 },
      { type: 'waves', weight: 0.25 },
    ],
    complexity: [5, 8],
    motionSpeed: [4, 7],
    chaosLevel: [5, 8],
  },
  ethereal: {
    colorRanges: { h: [180, 300], s: [30, 62], l: [66, 88] },
    bgColorRanges: { h: [190, 300], s: [12, 32], l: [10, 18] },
    shapePool: [
      { type: 'waves', weight: 0.36 },
      { type: 'curves', weight: 0.34 },
      { type: 'circles', weight: 0.3 },
    ],
    complexity: [2, 4],
    motionSpeed: [1, 3],
    chaosLevel: [1, 3],
  },
  gritty: {
    colorRanges: { h: [20, 220], s: [20, 48], l: [38, 62] },
    bgColorRanges: { h: [25, 230], s: [10, 30], l: [8, 16] },
    shapePool: [
      { type: 'lines', weight: 0.4 },
      { type: 'triangles', weight: 0.34 },
      { type: 'curves', weight: 0.26 },
    ],
    complexity: [5, 8],
    motionSpeed: [4, 7],
    chaosLevel: [5, 8],
  },
  neutral: {
    colorRanges: { h: [200, 280], s: [40, 70], l: [50, 70] },
    bgColorRanges: { h: [220, 280], s: [25, 50], l: [10, 20] },
    shapePool: [
      { type: 'spirals', weight: 0.3 },
      { type: 'circles', weight: 0.25 },
      { type: 'waves', weight: 0.25 },
      { type: 'curves', weight: 0.2 },
    ],
    complexity: [4, 6],
    motionSpeed: [4, 6],
    chaosLevel: [4, 6],
  },
};

const styleShapeBoosts: Record<string, string[]> = {
  geometric: ['triangles', 'lines'],
  minimal: ['circles', 'lines'],
  organic: ['waves', 'spirals', 'circles', 'curves'],
  abstract: ['spirals', 'triangles', 'waves', 'curves'],
  dreamy: ['waves', 'circles', 'curves'],
};

const imageryShapeBoosts: Record<string, string[]> = {
  ocean: ['waves', 'circles', 'curves'],
  sea: ['waves'],
  forest: ['spirals', 'waves', 'curves'],
  city: ['lines', 'triangles'],
  storm: ['lines', 'triangles'],
  night: ['circles', 'waves', 'curves'],
  fire: ['triangles', 'lines'],
  sky: ['circles', 'spirals', 'curves'],
};

function hashKeyword(keyword: string): number[] {
  let hash1 = 0, hash2 = 0, hash3 = 0, hash4 = 0, hash5 = 0, hash6 = 0;
  for (let i = 0; i < keyword.length; i++) {
    const char = keyword.charCodeAt(i);
    hash1 = ((hash1 << 5) - hash1) + char;
    hash2 = ((hash2 << 7) - hash2) + char * 2;
    hash3 = ((hash3 << 3) - hash3) + char * 3;
    hash4 = ((hash4 << 11) - hash4) + char * 4;
    hash5 = ((hash5 << 9) - hash5) + char * 5;
    hash6 = ((hash6 << 13) - hash6) + char * 6;
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

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function randomInRange(seed: number, min: number, max: number): number {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
}

interface KeywordProperties {
  rotationVariance: number;
  sizeCurve: number;
  positionBias: 'center' | 'edge' | 'uniform';
  strokeWidth: number;
  layerCount: number;
  shapeMixCount: number;
}

function getKeywordProperties(keyword: string): KeywordProperties {
  const [h1, h2, h3, h4, h5, h6] = hashKeyword(keyword);

  return {
    rotationVariance: h1 % 360,
    sizeCurve: h2 % 100 / 100,
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

function enforceCleanComposition(params: ArtParams): ArtParams {
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

function buildSemanticShapePool(
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

function selectShapeTypes(
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
  shapePool: ShapePoolItem[],
  variationSeed: number,
  strength: number,
  optionIndex: number
): ShapePoolItem[] {
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

function shapeDistance(left: string[], right: string[]): number {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const union = new Set([...Array.from(leftSet), ...Array.from(rightSet)]);
  if (union.size === 0) {
    return 0;
  }

  const intersectionCount = Array.from(leftSet).filter((shape) => rightSet.has(shape)).length;
  return 1 - intersectionCount / union.size;
}

export function computeOptionDistance(a: ArtParams, b: ArtParams): number {
  const noiseDelta = a.noisePlacement && b.noisePlacement
    ? (
      Math.abs(a.noisePlacement.scale - b.noisePlacement.scale) * 35 +
      Math.abs(a.noisePlacement.strength - b.noisePlacement.strength) / 2 +
      Math.abs(a.noisePlacement.octaves - b.noisePlacement.octaves) / 4 +
      Math.abs(a.noisePlacement.lacunarity - b.noisePlacement.lacunarity) / 2 +
      Math.abs(a.noisePlacement.gain - b.noisePlacement.gain)
    ) / 5
    : 0;

  const deltas = [
    Math.abs(a.complexity - b.complexity) / 9,
    Math.abs(a.motionSpeed - b.motionSpeed) / 9,
    Math.abs(a.chaosLevel - b.chaosLevel) / 9,
    Math.abs(a.rotationVariance - b.rotationVariance) / 359,
    Math.abs(a.sizeCurve - b.sizeCurve),
    Math.abs(a.strokeWidth - b.strokeWidth) / 6,
    Math.abs(a.layerCount - b.layerCount) / 2,
    a.positionBias === b.positionBias ? 0 : 1,
    shapeDistance(a.shapeTypes, b.shapeTypes),
    ensureRenderAlgorithm(a.renderAlgorithm) === ensureRenderAlgorithm(b.renderAlgorithm) ? 0 : 1,
    (a.paletteId ?? '') === (b.paletteId ?? '') ? 0 : 1,
    noiseDelta,
  ];

  return deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;
}

export function summarizeVariation(baseParams: ArtParams, variedParams: ArtParams): string {
  const changes: string[] = [];
  const numberFields: Array<keyof Pick<ArtParams, 'complexity' | 'motionSpeed' | 'chaosLevel' | 'rotationVariance' | 'strokeWidth' | 'layerCount'>> = [
    'complexity',
    'motionSpeed',
    'chaosLevel',
    'rotationVariance',
    'strokeWidth',
    'layerCount',
  ];

  for (const field of numberFields) {
    const delta = variedParams[field] - baseParams[field];
    if (delta !== 0) {
      const sign = delta > 0 ? '+' : '';
      changes.push(`${field}:${sign}${delta}`);
    }
  }

  if (Math.abs(variedParams.sizeCurve - baseParams.sizeCurve) >= 0.05) {
    const sizeDelta = (variedParams.sizeCurve - baseParams.sizeCurve).toFixed(2);
    const sign = variedParams.sizeCurve >= baseParams.sizeCurve ? '+' : '';
    changes.push(`sizeCurve:${sign}${sizeDelta}`);
  }

  if (variedParams.positionBias !== baseParams.positionBias) {
    changes.push(`positionBias:${baseParams.positionBias}->${variedParams.positionBias}`);
  }

  if (shapeDistance(baseParams.shapeTypes, variedParams.shapeTypes) > 0) {
    changes.push(`shapeTypes:${baseParams.shapeTypes.join('|')}->${variedParams.shapeTypes.join('|')}`);
  }

  if (ensureRenderAlgorithm(baseParams.renderAlgorithm) !== ensureRenderAlgorithm(variedParams.renderAlgorithm)) {
    changes.push(`algorithm:${ensureRenderAlgorithm(baseParams.renderAlgorithm)}->${ensureRenderAlgorithm(variedParams.renderAlgorithm)}`);
  }

  if ((baseParams.paletteId ?? '') !== (variedParams.paletteId ?? '')) {
    changes.push(`palette:${baseParams.paletteId ?? 'n/a'}->${variedParams.paletteId ?? 'n/a'}`);
  }

  return changes.length > 0 ? changes.join(', ') : 'no significant variation';
}

export function buildVariationMeta(
  baseParams: ArtParams,
  variedParams: ArtParams
): { variationSummary: string; optionDistance: number } {
  return {
    variationSummary: summarizeVariation(baseParams, variedParams),
    optionDistance: Number(computeOptionDistance(baseParams, variedParams).toFixed(3)),
  };
}

function createBaseParams(
  mood: string,
  keyword: string | undefined,
  semanticProfile: SemanticProfile | undefined,
  seed: number
): ArtParams {
  const normalizedMood = mood.toLowerCase();
  const moodData = moodToParams[normalizedMood] || moodToParams.neutral;
  const { energy, valence, tempo } = getSemanticScalars(semanticProfile);
  const keywordText = keyword || '';

  const kwProps = keyword ? getKeywordProperties(keyword) : {
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
  const algorithm = selectRenderAlgorithm(normalizedMood, semanticProfile, seed + hashSeed, 0);

  const baseParams: ArtParams = {
    seed,
    mood: normalizedMood,
    colors: shapeColors,
    backgroundColors,
    shapeTypes,
    complexity: baseComplexity,
    motionSpeed: clamp(
      Math.round(randomInRange(hashSeed + 200, moodData.motionSpeed[0], moodData.motionSpeed[1]) * tempoBoost),
      1,
      10
    ),
    chaosLevel: clamp(
      randomInRange(hashSeed + 300, moodData.chaosLevel[0], moodData.chaosLevel[1]) + chaosShift,
      1,
      10
    ),
    rotationVariance: clamp(
      kwProps.rotationVariance + Math.round(energy * 25 - valence * 10),
      0,
      359
    ),
    sizeCurve: kwProps.sizeCurve,
    positionBias: kwProps.positionBias,
    strokeWidth: clamp(kwProps.strokeWidth + (energy > 0.8 ? 1 : 0), 1, 7),
    layerCount: kwProps.layerCount,
    renderAlgorithm: algorithm,
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

function applyControlledVariation(
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
  const variedShapePool = buildVariationShapePool(
    shapePool,
    variationSeed,
    strength,
    variationContext.optionIndex
  );

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
  const variedAlgorithm = strength > 0.45
    ? selectRenderAlgorithm(baseParams.mood, semanticProfile, variationSeed + 991, variationContext.optionIndex)
    : ensureRenderAlgorithm(baseParams.renderAlgorithm);
  const valence = semanticProfile?.valence ?? 0;
  const variedPalette = selectCuratedPalette({
    mood: baseParams.mood,
    seed: variationSeed + 1401 + variationContext.optionIndex * 97,
    valence,
    imageryTags: semanticProfile?.imageryTags ?? [],
  });

  const variedParams: ArtParams = {
    ...baseParams,
    shapeTypes: selectShapeTypes(variedShapePool, shapeCount, variationSeed + 631),
    complexity: variedComplexity,
    motionSpeed: varyInt(baseParams.motionSpeed, 1, 10, variationSeed, 202, strength, variationContext.optionIndex, 5),
    chaosLevel: varyInt(baseParams.chaosLevel, 1, 10, variationSeed, 303, strength, variationContext.optionIndex, 6),
    rotationVariance: varyInt(baseParams.rotationVariance, 0, 359, variationSeed, 404, strength, variationContext.optionIndex, 150),
    sizeCurve: Number(
      varyFloat(baseParams.sizeCurve, 0, 1, variationSeed, 505, strength, variationContext.optionIndex, 0.45).toFixed(2)
    ),
    positionBias: varyPositionBias(baseParams.positionBias, variationSeed, strength),
    strokeWidth: varyInt(baseParams.strokeWidth, 1, 7, variationSeed, 606, strength, variationContext.optionIndex, 3),
    layerCount: varyInt(baseParams.layerCount, 1, 3, variationSeed, 707, strength, variationContext.optionIndex, 2),
    renderAlgorithm: variedAlgorithm,
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

function resolveSeed(keyword: string | undefined, variationContext?: VariationContext): number {
  if (!variationContext) {
    return Math.floor(Math.random() * 1000000);
  }

  const keywordSeed = keyword ? hashKeyword(keyword).reduce((a, b) => a + b, 0) : 0;
  const derived = variationContext.baseSeed * 13 + (variationContext.optionIndex + 1) * 7919 + keywordSeed * 7;
  return normalizeSeed(derived);
}

export function generateArtParams(
  mood: string,
  keyword?: string,
  semanticProfile?: SemanticProfile,
  variationContext?: VariationContext
): ArtParams {
  const seed = resolveSeed(keyword, variationContext);
  const baseParams = createBaseParams(mood, keyword, semanticProfile, seed);

  if (!variationContext || variationContext.mode !== 'compare-controlled') {
    return baseParams;
  }

  return applyControlledVariation(baseParams, keyword, semanticProfile, variationContext);
}

export function artParamsToJSON(params: ArtParams): string {
  return JSON.stringify(params);
}

export function jsonToArtParams(json: string): ArtParams {
  return JSON.parse(json) as ArtParams;
}
