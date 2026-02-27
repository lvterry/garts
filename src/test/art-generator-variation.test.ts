import { describe, expect, it, vi } from 'vitest';

vi.unmock('@/lib/art-generator');

import {
  computeOptionDistance,
  generateArtParams,
  type VariationContext,
} from '@/lib/art-generator';
import type { SemanticProfile } from '@/lib/ai';
import { isKnownPaletteId } from '@/lib/art-generator/palettes';

const semanticProfile: SemanticProfile = {
  coreMood: 'serene',
  energy: 0.35,
  valence: 0.4,
  tempo: 'calm',
  imageryTags: ['sunset', 'horizon'],
  styleHints: ['minimal'],
  pipelinePath: 'direct-semantic',
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
    expect(params.shapeTypes).not.toContain('curves');
  });

  it('is deterministic for same variation context', () => {
    const context = buildContext(1, 0.75, 939393);
    const first = generateArtParams('joyful', 'city lights', semanticProfile, context);
    const second = generateArtParams('joyful', 'city lights', semanticProfile, context);

    expect(second).toEqual(first);
  });

  it('assigns curated palette, algorithm mode, and noise settings', () => {
    const params = generateArtParams('ethereal', 'misty tide', semanticProfile, buildContext(1, 0.8, 747474));

    expect(params.renderAlgorithm).toBeDefined();
    expect(params.renderAlgorithm).not.toBe('legacy-shapes');
    expect(params.paletteId).toBeDefined();
    expect(isKnownPaletteId(params.paletteId ?? '')).toBe(true);
    expect(params.paletteFamily).toBeDefined();
    expect(params.noisePlacement).toBeDefined();
    expect(params.noisePlacement?.octaves).toBeGreaterThanOrEqual(2);
    expect(params.noisePlacement?.octaves).toBeLessThanOrEqual(6);
    expect(params.algorithmConfig?.particleCount).toBeGreaterThanOrEqual(70);
    expect(params.algorithmConfig?.siteCount).toBeGreaterThanOrEqual(24);
    expect(params.shapeTypes).not.toContain('curves');
  });

  it('never selects curves in shapeTypes', () => {
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
    const hasCurves = seededContexts
      .map((context, idx) => generateArtParams('serene', keywords[idx], semanticProfile, context))
      .some((params) => params.shapeTypes.includes('curves'));

    expect(hasCurves).toBe(false);
  });
});
