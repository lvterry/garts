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

  it('supports new canonical moods with bounded params', () => {
    const newMoods = ['nostalgic', 'romantic', 'playful', 'ominous', 'ethereal', 'gritty'] as const;

    for (const mood of newMoods) {
      const params = generateArtParams(
        mood,
        `mood smoke ${mood}`,
        {
          ...baseProfile,
          coreMood: mood,
        },
        buildContext(0, 42)
      );

      expect(params.mood).toBe(mood);
      expect(params.colors.length).toBeGreaterThan(0);
      expect(params.backgroundColors.length).toBeGreaterThan(0);
      expect(params.shapeTypes.length).toBeGreaterThan(0);
      expect(params.complexity).toBeGreaterThanOrEqual(1);
      expect(params.complexity).toBeLessThanOrEqual(10);
      expect(params.motionSpeed).toBeGreaterThanOrEqual(1);
      expect(params.motionSpeed).toBeLessThanOrEqual(10);
      expect(params.chaosLevel).toBeGreaterThanOrEqual(1);
      expect(params.chaosLevel).toBeLessThanOrEqual(6);
      expect(params.rotationVariance).toBeGreaterThanOrEqual(0);
      expect(params.rotationVariance).toBeLessThanOrEqual(220);
    }
  });
});
