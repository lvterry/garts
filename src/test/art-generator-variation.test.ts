import { describe, expect, it, vi } from 'vitest';

vi.unmock('@/lib/art-generator');

import {
  computeOptionDistance,
  generateArtParams,
  type VariationContext,
} from '@/lib/art-generator';
import type { SemanticProfile } from '@/lib/ai';

const semanticProfile: SemanticProfile = {
  coreMood: 'serene',
  energy: 0.35,
  valence: 0.4,
  tempo: 'calm',
  imageryTags: ['sunset', 'horizon'],
  styleHints: ['minimal'],
  pipelinePath: 'direct-semantic',
};

const curveBoostedSemanticProfile: SemanticProfile = {
  ...semanticProfile,
  styleHints: ['organic', 'dreamy'],
  imageryTags: ['ocean', 'sky'],
};

function buildContext(optionIndex: number, strength: number, baseSeed = 424242): VariationContext {
  return {
    optionIndex,
    optionCount: 2,
    baseSeed,
    mode: 'compare-controlled',
    strength,
  };
}

describe('art-generator controlled variation', () => {
  it('changes multiple non-color params between two options', () => {
    const optionA = generateArtParams('serene', 'sunset lake', semanticProfile, buildContext(0, 0.25));
    const optionB = generateArtParams('serene', 'sunset lake', semanticProfile, buildContext(1, 0.9));

    const comparableKeys: Array<
      keyof Pick<
        typeof optionA,
        | 'shapeTypes'
        | 'complexity'
        | 'motionSpeed'
        | 'chaosLevel'
        | 'rotationVariance'
        | 'sizeCurve'
        | 'positionBias'
        | 'strokeWidth'
        | 'layerCount'
      >
    > = [
      'shapeTypes',
      'complexity',
      'motionSpeed',
      'chaosLevel',
      'rotationVariance',
      'sizeCurve',
      'positionBias',
      'strokeWidth',
      'layerCount',
    ];

    const changedCount = comparableKeys.filter((key) => {
      return JSON.stringify(optionA[key]) !== JSON.stringify(optionB[key]);
    }).length;

    expect(changedCount).toBeGreaterThanOrEqual(4);
    expect(computeOptionDistance(optionA, optionB)).toBeGreaterThanOrEqual(0.2);
  });

  it('keeps semantic lock and parameter bounds', () => {
    const params = generateArtParams('serene', 'moonlight ocean', semanticProfile, buildContext(1, 1));

    expect(params.mood).toBe('serene');
    expect(params.complexity).toBeGreaterThanOrEqual(2);
    expect(params.complexity).toBeLessThanOrEqual(10);
    expect(params.motionSpeed).toBeGreaterThanOrEqual(1);
    expect(params.motionSpeed).toBeLessThanOrEqual(10);
    expect(params.chaosLevel).toBeGreaterThanOrEqual(1);
    expect(params.chaosLevel).toBeLessThanOrEqual(10);
    expect(params.rotationVariance).toBeGreaterThanOrEqual(0);
    expect(params.rotationVariance).toBeLessThanOrEqual(359);
    expect(params.sizeCurve).toBeGreaterThanOrEqual(0);
    expect(params.sizeCurve).toBeLessThanOrEqual(1);
    expect(params.strokeWidth).toBeGreaterThanOrEqual(1);
    expect(params.strokeWidth).toBeLessThanOrEqual(7);
    expect(params.layerCount).toBeGreaterThanOrEqual(1);
    expect(params.layerCount).toBeLessThanOrEqual(2);
    expect(params.shapeTypes.length).toBeLessThanOrEqual(2);
    expect(params.chaosLevel).toBeLessThanOrEqual(6);
    expect(params.rotationVariance).toBeLessThanOrEqual(220);
    expect(params.shapeTypes.length * params.layerCount * params.complexity).toBeLessThanOrEqual(14);
    expect(['center', 'edge', 'uniform']).toContain(params.positionBias);
  });

  it('is deterministic for same variation context', () => {
    const context = buildContext(1, 0.75, 939393);
    const first = generateArtParams('joyful', 'city lights', semanticProfile, context);
    const second = generateArtParams('joyful', 'city lights', semanticProfile, context);

    expect(second).toEqual(first);
  });

  it('increases curve selection with semantic hints that favor curves', () => {
    const keywords = [
      'ocean breeze',
      'night sky',
      'misty coast',
      'moonlit forest',
      'silent tide',
      'starlit horizon',
      'rainy dusk',
      'foggy harbor',
    ];

    const seededContexts = keywords.map((_, idx) => buildContext(1, 0.8, 101000 + idx * 97));
    const plainCurveCount = seededContexts
      .map((context, idx) => generateArtParams('serene', keywords[idx], semanticProfile, context))
      .filter((params) => params.shapeTypes.includes('curves')).length;

    const boostedCurveCount = seededContexts
      .map((context, idx) => generateArtParams('serene', keywords[idx], curveBoostedSemanticProfile, context))
      .filter((params) => params.shapeTypes.includes('curves')).length;

    expect(boostedCurveCount).toBeGreaterThan(plainCurveCount);
    expect(boostedCurveCount).toBeGreaterThan(0);
  });
});
