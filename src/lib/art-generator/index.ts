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
  
  const positionOptions: ('center' | 'edge' | 'uniform')[] = ['center', 'edge', 'uniform'];
  
  return {
    rotationVariance: h1 % 360,
    sizeCurve: h2 % 100 / 100,
    positionBias: positionOptions[h3 % 3],
    strokeWidth: 1 + (h4 % 6),
    layerCount: 1 + (h5 % 3),
    shapeMixCount: 1 + (h6 % 3),
  };
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
  seed: number
): { shapeColors: string[]; backgroundColors: string[] } {
  const moodData = moodToParams[mood] || moodToParams.neutral;
  const ranges = moodData.colorRanges;
  const bgRanges = moodData.bgColorRanges;
  
  const baseSeed = hashKeyword(keyword).reduce((a, b) => a + b, 0) + seed;
  
  // Generate shape colors (bright)
  const baseH = seededRandom(baseSeed) * (ranges.h[1] - ranges.h[0]) + ranges.h[0];
  const baseS = seededRandom(baseSeed + 1) * (ranges.s[1] - ranges.s[0]) + ranges.s[0];
  const baseL = seededRandom(baseSeed + 2) * (ranges.l[1] - ranges.l[0]) + ranges.l[0];
  
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
  
  // Generate background colors (dark)
  const bgBaseSeed = baseSeed + 1000;
  const bgH = seededRandom(bgBaseSeed) * (bgRanges.h[1] - bgRanges.h[0]) + bgRanges.h[0];
  const bgS = seededRandom(bgBaseSeed + 1) * (bgRanges.s[1] - bgRanges.s[0]) + bgRanges.s[0];
  const bgL = seededRandom(bgBaseSeed + 2) * (bgRanges.l[1] - bgRanges.l[0]) + bgRanges.l[0];
  
  const backgroundColors: string[] = [];
  
  // Dark base color
  backgroundColors.push(hslToHex(bgH, bgS, bgL));
  
  // Slightly lighter/darker variations
  const bgOffset = seededRandom(bgBaseSeed + 3) * 8 - 4;
  backgroundColors.push(hslToHex(bgH + seededRandom(bgBaseSeed + 4) * 20 - 10, bgS * 0.8, bgL + bgOffset));
  
  // Complementary dark accent
  const bgCompHue = (bgH + 180) % 360;
  backgroundColors.push(hslToHex(bgCompHue, bgS * 0.5, bgL - 5));
  
  return {
    shapeColors: shapeColors.slice(0, 6),
    backgroundColors: backgroundColors.slice(0, 3),
  };
}

function selectShapeTypes(
  shapePool: ShapePoolItem[],
  count: number
): string[] {
  const totalWeight = shapePool.reduce((sum, item) => sum + item.weight, 0);
  const selected: string[] = [];
  const available = [...shapePool];
  
  for (let i = 0; i < count && available.length > 0; i++) {
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;
    
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

export function generateArtParams(mood: string, keyword?: string): ArtParams {
  const seed = Math.floor(Math.random() * 1000000);
  const normalizedMood = mood.toLowerCase();
  const moodData = moodToParams[normalizedMood] || moodToParams.neutral;
  
  const kwProps = keyword ? getKeywordProperties(keyword) : {
    rotationVariance: 45,
    sizeCurve: 0.5,
    positionBias: 'uniform' as const,
    strokeWidth: 2,
    layerCount: 1,
    shapeMixCount: 1,
  };
  
  const shapeCount = kwProps.shapeMixCount;
  const shapeTypes = selectShapeTypes(moodData.shapePool, shapeCount);
  
  const { shapeColors, backgroundColors } = generateColorPalette(normalizedMood, keyword || '', seed);
  
  const hashSeed = keyword ? hashKeyword(keyword).reduce((a, b) => a + b, 0) : seed;
  
  return {
    seed,
    mood: normalizedMood,
    colors: shapeColors,
    backgroundColors,
    shapeTypes,
    complexity: randomInRange(hashSeed + 100, moodData.complexity[0], moodData.complexity[1]),
    motionSpeed: randomInRange(hashSeed + 200, moodData.motionSpeed[0], moodData.motionSpeed[1]),
    chaosLevel: randomInRange(hashSeed + 300, moodData.chaosLevel[0], moodData.chaosLevel[1]),
    rotationVariance: kwProps.rotationVariance,
    sizeCurve: kwProps.sizeCurve,
    positionBias: kwProps.positionBias,
    strokeWidth: kwProps.strokeWidth,
    layerCount: kwProps.layerCount,
  };
}

export function artParamsToJSON(params: ArtParams): string {
  return JSON.stringify(params);
}

export function jsonToArtParams(json: string): ArtParams {
  return JSON.parse(json) as ArtParams;
}
