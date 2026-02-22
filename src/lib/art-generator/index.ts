export interface ArtParams {
  seed: number;
  mood: string;
  colors: string[];
  shapeType: 'circles' | 'triangles' | 'lines' | 'spirals' | 'waves';
  complexity: number; // 1-10
  motionSpeed: number; // 1-10
  chaosLevel: number; // 1-10
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

export function generateArtParams(mood: string): ArtParams {
  const normalizedMood = mood.toLowerCase();
  const baseParams = moodToParams[normalizedMood] || moodToParams.neutral;

  return {
    seed: Math.floor(Math.random() * 1000000),
    mood: normalizedMood,
    ...baseParams,
  };
}

export function artParamsToJSON(params: ArtParams): string {
  return JSON.stringify(params);
}

export function jsonToArtParams(json: string): ArtParams {
  return JSON.parse(json) as ArtParams;
}
