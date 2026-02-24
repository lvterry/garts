import { describe, expect, it } from 'vitest';
import { parseModelSemanticResponse, shouldUseExpansion } from '@/lib/ai/semantic';

describe('semantic parser', () => {
  it('parses structured JSON response', () => {
    const response = parseModelSemanticResponse(
      JSON.stringify({
        mood: 'joyful',
        confidence: 0.91,
        semanticProfile: {
          coreMood: 'joyful',
          energy: 0.82,
          valence: 0.9,
          tempo: 'fast',
          imageryTags: ['festival', 'sunlight'],
          styleHints: ['abstract'],
          expandedPrompt: 'A lively plaza filled with warm afternoon light.',
        },
      }),
      'festival',
      'direct-semantic'
    );

    expect(response.mood).toBe('joyful');
    expect(response.confidence).toBe(0.91);
    expect(response.semanticProfile?.tempo).toBe('fast');
    expect(response.semanticProfile?.imageryTags).toEqual(['festival', 'sunlight']);
    expect(response.semanticProfile?.pipelinePath).toBe('expand-then-extract');
  });

  it('falls back safely when response is invalid', () => {
    const response = parseModelSemanticResponse('not-json', 'calm horizon', 'direct-semantic');
    expect(response.mood).toBe('peaceful');
    expect(response.semanticProfile?.coreMood).toBe('peaceful');
    expect(response.semanticProfile?.pipelinePath).toBe('direct-semantic');
  });
});

describe('expansion gate', () => {
  it('enables expansion for sparse input', () => {
    expect(shouldUseExpansion('sunset')).toBe(true);
    expect(shouldUseExpansion('red storm')).toBe(true);
  });

  it('skips expansion for richer input', () => {
    expect(shouldUseExpansion('a quiet sunset over ocean cliffs')).toBe(false);
  });
});
