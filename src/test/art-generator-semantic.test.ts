import { describe, expect, it, vi } from 'vitest';
import { generateArtParams } from '@/lib/art-generator';
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
});
