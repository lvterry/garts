import { SemanticProfile } from '@/lib/ai';

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeSeed(seed: number): number {
  return Math.abs(seed) % 1_000_000;
}

const moodToParams: Record<string, MoodParams> = {
  serene: {
    colorRanges: { h: [180, 220], s: [40, 70], l: [60, 85] },
    bgColorRanges: { h: [200, 240], s: [20, 50], l: [12, 22] },
    shapePool: [
      { type: 'circles', weight: 0.5 },
      { type: 'waves', weight: 0.3 },
      { type: 'spirals', weight: 0.2 },
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
      { type: 'waves', weight: 0.5 },
      { type: 'circles', weight: 0.3 },
      { type: 'lines', weight: 0.2 },
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
      { type: 'circles', weight: 0.4 },
      { type: 'waves', weight: 0.3 },
      { type: 'spirals', weight: 0.3 },
    ],
    complexity: [4, 6],
    motionSpeed: [2, 4],
    chaosLevel: [3, 5],
  },
  peaceful: {
    colorRanges: { h: [90, 150], s: [35, 60], l: [55, 75] },
    bgColorRanges: { h: [100, 160], s: [20, 45], l: [12, 22] },
    shapePool: [
      { type: 'waves', weight: 0.45 },
      { type: 'circles', weight: 0.35 },
      { type: 'spirals', weight: 0.2 },
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
  neutral: {
    colorRanges: { h: [200, 280], s: [40, 70], l: [50, 70] },
    bgColorRanges: { h: [220, 280], s: [25, 50], l: [10, 20] },
    shapePool: [
      { type: 'spirals', weight: 0.35 },
      { type: 'circles', weight: 0.35 },
      { type: 'waves', weight: 0.3 },
    ],
    complexity: [4, 6],
    motionSpeed: [4, 6],
    chaosLevel: [4, 6],
  },
};

const styleShapeBoosts: Record<string, string[]> = {
  geometric: ['triangles', 'lines'],
  minimal: ['circles', 'lines'],
  organic: ['waves', 'spirals', 'circles'],
  abstract: ['spirals', 'triangles', 'waves'],
  dreamy: ['waves', 'circles'],
};

const imageryShapeBoosts: Record<string, string[]> = {
  ocean: ['waves', 'circles'],
  sea: ['waves'],
  forest: ['spirals', 'waves'],
  city: ['lines', 'triangles'],
  storm: ['lines', 'triangles'],
  night: ['circles', 'waves'],
  fire: ['triangles', 'lines'],
  sky: ['circles', 'spirals'],
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

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));

  const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l / 100 - c / 2;

  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function generateColorPalette(
  mood: string,
  keyword: string,
  seed: number,
  semanticProfile?: SemanticProfile
): { shapeColors: string[]; backgroundColors: string[] } {
  const moodData = moodToParams[mood] || moodToParams.neutral;
  const ranges = moodData.colorRanges;
  const bgRanges = moodData.bgColorRanges;
  const { energy, valence } = getSemanticScalars(semanticProfile);

  const baseSeed = hashKeyword(keyword).reduce((a, b) => a + b, 0) + seed;

  const hueShift = valence * 18;
  const saturationShift = (energy - 0.5) * 26;
  const luminanceShift = valence * 8;

  const baseH = seededRandom(baseSeed) * (ranges.h[1] - ranges.h[0]) + ranges.h[0] + hueShift;
  const baseS = clamp(
    seededRandom(baseSeed + 1) * (ranges.s[1] - ranges.s[0]) + ranges.s[0] + saturationShift,
    20,
    100
  );
  const baseL = clamp(
    seededRandom(baseSeed + 2) * (ranges.l[1] - ranges.l[0]) + ranges.l[0] + luminanceShift,
    15,
    90
  );

  const shapeColors: string[] = [];

  shapeColors.push(hslToHex(baseH, baseS, baseL));

  const analogousOffset = 20 + seededRandom(baseSeed + 3) * 20;
  shapeColors.push(hslToHex(baseH + analogousOffset, baseS, baseL));
  shapeColors.push(hslToHex(baseH - analogousOffset, baseS, baseL));

  const complementaryHue = (baseH + 180) % 360;
  const compVariation = seededRandom(baseSeed + 4) * 20 - 10;
  shapeColors.push(hslToHex(complementaryHue + compVariation, baseS * 0.8, baseL + 5));

  if (seededRandom(baseSeed + 5) > 0.4) {
    const tintedL = Math.min(90, baseL + 25);
    shapeColors.push(hslToHex(baseH + seededRandom(baseSeed + 6) * 15 - 7.5, baseS * 0.5, tintedL));
  }

  if (seededRandom(baseSeed + 7) > 0.5) {
    const shadedL = Math.max(15, baseL - 15);
    shapeColors.push(hslToHex(baseH + seededRandom(baseSeed + 8) * 10 - 5, baseS * 1.1, shadedL));
  }

  const bgBaseSeed = baseSeed + 1000;
  const bgH = seededRandom(bgBaseSeed) * (bgRanges.h[1] - bgRanges.h[0]) + bgRanges.h[0] - hueShift * 0.35;
  const bgS = clamp(
    seededRandom(bgBaseSeed + 1) * (bgRanges.s[1] - bgRanges.s[0]) + bgRanges.s[0] + saturationShift * 0.5,
    10,
    100
  );
  const bgL = clamp(
    seededRandom(bgBaseSeed + 2) * (bgRanges.l[1] - bgRanges.l[0]) + bgRanges.l[0] - luminanceShift * 0.4,
    4,
    30
  );

  const backgroundColors: string[] = [];

  backgroundColors.push(hslToHex(bgH, bgS, bgL));

  const bgOffset = seededRandom(bgBaseSeed + 3) * 8 - 4;
  backgroundColors.push(hslToHex(bgH + seededRandom(bgBaseSeed + 4) * 20 - 10, bgS * 0.8, bgL + bgOffset));

  const bgCompHue = (bgH + 180) % 360;
  backgroundColors.push(hslToHex(bgCompHue, bgS * 0.5, bgL - 5));

  return {
    shapeColors: shapeColors.slice(0, 6),
    backgroundColors: backgroundColors.slice(0, 3),
  };
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

  const { shapeColors, backgroundColors } = generateColorPalette(
    normalizedMood,
    keywordText,
    seed,
    semanticProfile
  );

  const tempoBoost = tempo === 'fast' ? 1.1 : tempo === 'calm' ? 0.9 : 1;
  const complexityShift = Math.round((energy - 0.5) * 2);
  const chaosShift = Math.round((energy - 0.5) * 3 - valence * 1.2);

  return {
    seed,
    mood: normalizedMood,
    colors: shapeColors,
    backgroundColors,
    shapeTypes,
    complexity: clamp(
      randomInRange(hashSeed + 100, moodData.complexity[0], moodData.complexity[1]) + complexityShift,
      1,
      10
    ),
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

  return {
    ...baseParams,
    shapeTypes: selectShapeTypes(variedShapePool, shapeCount, variationSeed + 631),
    complexity: varyInt(baseParams.complexity, 1, 10, variationSeed, 101, strength, variationContext.optionIndex, 5),
    motionSpeed: varyInt(baseParams.motionSpeed, 1, 10, variationSeed, 202, strength, variationContext.optionIndex, 5),
    chaosLevel: varyInt(baseParams.chaosLevel, 1, 10, variationSeed, 303, strength, variationContext.optionIndex, 6),
    rotationVariance: varyInt(baseParams.rotationVariance, 0, 359, variationSeed, 404, strength, variationContext.optionIndex, 150),
    sizeCurve: Number(
      varyFloat(baseParams.sizeCurve, 0, 1, variationSeed, 505, strength, variationContext.optionIndex, 0.45).toFixed(2)
    ),
    positionBias: varyPositionBias(baseParams.positionBias, variationSeed, strength),
    strokeWidth: varyInt(baseParams.strokeWidth, 1, 7, variationSeed, 606, strength, variationContext.optionIndex, 3),
    layerCount: varyInt(baseParams.layerCount, 1, 3, variationSeed, 707, strength, variationContext.optionIndex, 2),
  };
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
