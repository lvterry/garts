import { describe, expect, it } from 'vitest';
import { getWavePathCount } from '@/components/SvgArtCanvas';

describe('SvgArtCanvas wave path floor', () => {
  it('enforces minimum wave paths for calm moods', () => {
    expect(getWavePathCount('serene', 1)).toBe(2);
    expect(getWavePathCount('peaceful', 1)).toBe(2);
    expect(getWavePathCount('melancholic', 1)).toBe(2);
    expect(getWavePathCount('Serene', 1)).toBe(2);
  });

  it('keeps requested complexity for non-calm moods', () => {
    expect(getWavePathCount('chaotic', 1)).toBe(1);
    expect(getWavePathCount('neutral', 3)).toBe(3);
  });
});
