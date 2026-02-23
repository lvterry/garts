export interface ArtParams {
  seed: number;
  mood: string;
  colors: string[];
  shapeType: 'circles' | 'triangles' | 'lines' | 'spirals' | 'waves';
  complexity: number;
  motionSpeed: number;
  chaosLevel: number;
}

const moodToParams: Record<string, Omit<ArtParams, 'seed' | 'mood'>> = {
  serene: {
    colors: ['#a8d8ea', '#aa96da', '#fcbad3', '#ffffd2'],
    shapeType: 'circles',
    complexity: 3,
    motionSpeed: 2,
    chaosLevel: 2,
  },
  chaotic: {
    colors: ['#ff6b6b', '#feca57', '#ff9ff3', '#54a0ff'],
    shapeType: 'triangles',
    complexity: 9,
    motionSpeed: 9,
    chaosLevel: 9,
  },
  joyful: {
    colors: ['#ffd93d', '#ff6b6b', '#6bcb77', '#4d96ff'],
    shapeType: 'spirals',
    complexity: 6,
    motionSpeed: 7,
    chaosLevel: 5,
  },
  melancholic: {
    colors: ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6'],
    shapeType: 'waves',
    complexity: 4,
    motionSpeed: 2,
    chaosLevel: 3,
  },
  energetic: {
    colors: ['#ff0844', '#ffb199', '#f6d365', '#fda085'],
    shapeType: 'lines',
    complexity: 8,
    motionSpeed: 10,
    chaosLevel: 8,
  },
  mysterious: {
    colors: ['#0f0c29', '#302b63', '#24243e', '#4a148c'],
    shapeType: 'circles',
    complexity: 5,
    motionSpeed: 3,
    chaosLevel: 4,
  },
  peaceful: {
    colors: ['#56ab2f', '#a8e063', '#e8f5e9', '#b2dfdb'],
    shapeType: 'waves',
    complexity: 3,
    motionSpeed: 2,
    chaosLevel: 2,
  },
  intense: {
    colors: ['#cc2b5e', '#753a88', '#42275a', '#734b6d'],
    shapeType: 'triangles',
    complexity: 10,
    motionSpeed: 8,
    chaosLevel: 10,
  },
  neutral: {
    colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
    shapeType: 'spirals',
    complexity: 5,
    motionSpeed: 5,
    chaosLevel: 5,
  },
};

function getKeywordModifier(keyword: string): number {
  let hash = 0;
  for (let i = 0; i < keyword.length; i++) {
    hash = ((hash << 5) - hash) + keyword.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % 7 - 3;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 50 };
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
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

function deriveAccentColor(keyword: string, baseColors: string[]): string {
  const modifier = getKeywordModifier(keyword);
  const hueShift = modifier * 15;
  const { h, s, l } = hexToHsl(baseColors[0]);
  return hslToHex(h + hueShift, s, l);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function generateArtParams(mood: string, keyword?: string): ArtParams {
  const normalizedMood = mood.toLowerCase();
  const baseParams = moodToParams[normalizedMood] || moodToParams.neutral;
  
  const modifier = keyword ? getKeywordModifier(keyword) : 0;
  
  const colors = keyword 
    ? [...baseParams.colors, deriveAccentColor(keyword, baseParams.colors)]
    : baseParams.colors;

  return {
    seed: Math.floor(Math.random() * 1000000),
    mood: normalizedMood,
    colors,
    shapeType: baseParams.shapeType,
    complexity: clamp(baseParams.complexity + modifier, 1, 10),
    motionSpeed: clamp(baseParams.motionSpeed + modifier, 1, 10),
    chaosLevel: clamp(baseParams.chaosLevel + modifier, 1, 10),
  };
}

export function artParamsToJSON(params: ArtParams): string {
  return JSON.stringify(params);
}

export function jsonToArtParams(json: string): ArtParams {
  return JSON.parse(json) as ArtParams;
}
