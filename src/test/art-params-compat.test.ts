import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';
vi.unmock('@/lib/art-generator');
import { artParamsToJSON, generateArtParams, jsonToArtParams } from '@/lib/art-generator';

describe('art params compatibility', () => {
  it('preserves core fields in json roundtrip', () => {
    const params = generateArtParams('serene', 'quiet horizon');
    const decoded = jsonToArtParams(artParamsToJSON(params));

    expect(decoded).toHaveProperty('seed');
    expect(decoded).toHaveProperty('mood');
    expect(decoded).toHaveProperty('colors');
    expect(decoded).toHaveProperty('backgroundColors');
    expect(decoded).toHaveProperty('shapeTypes');
    expect(decoded).toHaveProperty('complexity');
    expect(decoded).toHaveProperty('motionSpeed');
    expect(decoded).toHaveProperty('chaosLevel');
    expect(decoded).toHaveProperty('rotationVariance');
    expect(decoded).toHaveProperty('sizeCurve');
    expect(decoded).toHaveProperty('positionBias');
    expect(decoded).toHaveProperty('strokeWidth');
    expect(decoded).toHaveProperty('layerCount');
  });
});
