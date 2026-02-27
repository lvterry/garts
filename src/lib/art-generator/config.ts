import type { ArtParams } from '@/lib/art/types';

export interface ShapePoolItem {
  type: string;
  weight: number;
}

export interface MoodParams {
  shapePool: ShapePoolItem[];
  complexity: [number, number];
  motionSpeed: [number, number];
  chaosLevel: [number, number];
}

export const OPTION_STRENGTH_PRESETS = [0.25, 0.55, 0.75, 0.9];
export const POSITION_OPTIONS: ArtParams['positionBias'][] = ['center', 'edge', 'uniform'];
export const MAX_VISUAL_DENSITY = 14;
export const MAX_SHAPE_TYPES = 2;
export const MAX_LAYER_COUNT = 2;
export const MAX_CHAOS_LEVEL = 6;
export const MAX_ROTATION_VARIANCE = 220;

export const CALM_MOOD_COMPLEXITY_FLOOR: Record<string, number> = {
  serene: 2,
  peaceful: 2,
  melancholic: 2,
};

export const moodToParams: Record<string, MoodParams> = {
  serene: {
    shapePool: [
      { type: 'circles', weight: 0.4 },
      { type: 'waves', weight: 0.25 },
      { type: 'spirals', weight: 0.15 },
    ],
    complexity: [2, 4],
    motionSpeed: [1, 3],
    chaosLevel: [1, 3],
  },
  chaotic: {
    shapePool: [
      { type: 'triangles', weight: 0.6 },
      { type: 'lines', weight: 0.4 },
    ],
    complexity: [7, 10],
    motionSpeed: [7, 10],
    chaosLevel: [7, 10],
  },
  joyful: {
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
    shapePool: [
      { type: 'waves', weight: 0.4 },
      { type: 'circles', weight: 0.2 },
      { type: 'lines', weight: 0.15 },
    ],
    complexity: [3, 5],
    motionSpeed: [1, 3],
    chaosLevel: [2, 4],
  },
  energetic: {
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
    shapePool: [
      { type: 'circles', weight: 0.3 },
      { type: 'waves', weight: 0.2 },
      { type: 'spirals', weight: 0.3 },
    ],
    complexity: [4, 6],
    motionSpeed: [2, 4],
    chaosLevel: [3, 5],
  },
  peaceful: {
    shapePool: [
      { type: 'waves', weight: 0.35 },
      { type: 'circles', weight: 0.25 },
      { type: 'spirals', weight: 0.2 },
    ],
    complexity: [2, 4],
    motionSpeed: [1, 3],
    chaosLevel: [1, 3],
  },
  intense: {
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
    shapePool: [
      { type: 'waves', weight: 0.38 },
      { type: 'circles', weight: 0.34 },
    ],
    complexity: [3, 5],
    motionSpeed: [2, 4],
    chaosLevel: [2, 4],
  },
  romantic: {
    shapePool: [
      { type: 'circles', weight: 0.4 },
      { type: 'spirals', weight: 0.26 },
    ],
    complexity: [4, 6],
    motionSpeed: [3, 5],
    chaosLevel: [2, 4],
  },
  playful: {
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
    shapePool: [
      { type: 'waves', weight: 0.36 },
      { type: 'circles', weight: 0.3 },
    ],
    complexity: [2, 4],
    motionSpeed: [1, 3],
    chaosLevel: [1, 3],
  },
  gritty: {
    shapePool: [
      { type: 'lines', weight: 0.4 },
      { type: 'triangles', weight: 0.34 },
    ],
    complexity: [5, 8],
    motionSpeed: [4, 7],
    chaosLevel: [5, 8],
  },
  neutral: {
    shapePool: [
      { type: 'spirals', weight: 0.3 },
      { type: 'circles', weight: 0.25 },
      { type: 'waves', weight: 0.25 },
    ],
    complexity: [4, 6],
    motionSpeed: [4, 6],
    chaosLevel: [4, 6],
  },
};

export const styleShapeBoosts: Record<string, string[]> = {
  geometric: ['triangles', 'lines'],
  minimal: ['circles', 'lines'],
  organic: ['waves', 'spirals', 'circles'],
  abstract: ['spirals', 'triangles', 'waves'],
  dreamy: ['waves', 'circles'],
};

export const imageryShapeBoosts: Record<string, string[]> = {
  ocean: ['waves', 'circles'],
  sea: ['waves'],
  forest: ['spirals', 'waves'],
  city: ['lines', 'triangles'],
  storm: ['lines', 'triangles'],
  night: ['circles', 'waves'],
  fire: ['triangles', 'lines'],
  sky: ['circles', 'spirals'],
};
