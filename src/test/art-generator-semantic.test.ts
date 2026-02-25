import { describe, expect, it, vi } from 'vitest';
vi.unmock('@/lib/art-generator');
import { generateArtParams, getMoodComplexityFloor, type VariationContext } from '@/lib/art-generator';
import { SemanticProfile } from '@/lib/ai';

const baseProfile: SemanticProfile = {
  coreMood: 'serene',
  energy: 0.2,
  valence: 0.3,
  tempo: 'calm',
  imageryTags: ['ocean'],
  styleHints: ['minimal'],
  pipelinePath: 'direct-semantic',
};

describe('generateArtParams semantic mapping', () => {
  function buildContext(optionIndex: number, baseSeed: number): VariationContext {
    return {
      optionIndex,
      optionCount: 2,
      baseSeed,
      mode: 'compare-controlled',
      strength: 0,
    };
  }

  it('adjusts dynamics for higher energy and faster tempo', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.42);

    const lowEnergy = generateArtParams('serene', 'quiet sea', baseProfile);
    const highEnergy = generateArtParams('serene', 'quiet sea', {
      ...baseProfile,
      energy: 0.95,
      tempo: 'fast',
      valence: -0.2,
    });

    randomSpy.mockRestore();

    expect(highEnergy.motionSpeed).toBeGreaterThanOrEqual(lowEnergy.motionSpeed);
    expect(highEnergy.chaosLevel).toBeGreaterThanOrEqual(lowEnergy.chaosLevel);
    expect(highEnergy.rotationVariance).toBeGreaterThanOrEqual(lowEnergy.rotationVariance);
  });

  it('applies calm mood complexity floor for serene outputs', () => {
    const lowEnergyProfile: SemanticProfile = {
      ...baseProfile,
      energy: 0,
      tempo: 'calm',
    };

    for (let seed = 1; seed <= 40; seed++) {
      const params = generateArtParams('serene', 'quiet sea', lowEnergyProfile, buildContext(0, seed));
      expect(params.complexity).toBeGreaterThanOrEqual(2);
    }
  });

  it('exposes mood complexity floor policy', () => {
    expect(getMoodComplexityFloor('serene')).toBe(2);
    expect(getMoodComplexityFloor('peaceful')).toBe(2);
    expect(getMoodComplexityFloor('chaotic')).toBe(1);
  });
});
