import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

describe('POST /api/art/generate', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns art preview data when given a valid keyword', async () => {
    const { createMoodAnalyzer } = await import('@/lib/ai');
    const { generateArtParams } = await import('@/lib/art-generator');

    const mockMoodAnalyzer = {
      extractMood: vi.fn().mockResolvedValue({
        mood: 'serene',
        confidence: 0.88,
        semanticProfile: {
          coreMood: 'serene',
          energy: 0.3,
          valence: 0.4,
          tempo: 'calm',
          imageryTags: ['sunset', 'horizon'],
          styleHints: ['minimal'],
          pipelinePath: 'direct-semantic',
        },
      }),
    };
    (createMoodAnalyzer as ReturnType<typeof vi.fn>).mockReturnValue(mockMoodAnalyzer);
    (generateArtParams as ReturnType<typeof vi.fn>).mockReturnValue({
      seed: 123456,
      mood: 'serene',
      colors: ['#a8d8ea'],
      backgroundColors: ['#112233'],
      shapeTypes: ['circles'],
      complexity: 3,
      motionSpeed: 2,
      chaosLevel: 2,
      rotationVariance: 45,
      sizeCurve: 0.5,
      positionBias: 'center',
      strokeWidth: 2,
      layerCount: 1,
    });

    const handler = (await import('@/app/api/art/generate/route')).POST;

    const request = new NextRequest('http://localhost/api/art/generate', {
      method: 'POST',
      body: JSON.stringify({ keyword: 'sunset' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await handler(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('keyword', 'sunset');
    expect(data).toHaveProperty('mood', 'serene');
    expect(data).toHaveProperty('artParams');
    expect(data).toHaveProperty('options');
    expect(Array.isArray(data.options)).toBe(true);
    expect(data.options).toHaveLength(1);
    expect(data.options[0]).toHaveProperty('label', 'Option A');
    expect(data.options[0]).toHaveProperty('artParams');
    expect(data).toHaveProperty('debug');
    expect(data.debug).toHaveProperty('confidence', 0.88);
    expect(data.debug).toHaveProperty('pipelinePath', 'direct-semantic');
    expect(data.debug).toHaveProperty('semanticProfile');
    expect(data.artParams).toHaveProperty('seed', 123456);
    expect(data.artParams).toHaveProperty('colors');
    expect(data.artParams).toHaveProperty('backgroundColors');
    expect(data.artParams).toHaveProperty('shapeTypes');
    expect(data.artParams).toHaveProperty('positionBias', 'center');
  });

  it('returns multiple options and keeps artParams compatible with the first option', async () => {
    const { createMoodAnalyzer } = await import('@/lib/ai');
    const { generateArtParams } = await import('@/lib/art-generator');

    const mockMoodAnalyzer = {
      extractMood: vi.fn().mockResolvedValue({
        mood: 'serene',
        confidence: 0.88,
        semanticProfile: {
          coreMood: 'serene',
          energy: 0.3,
          valence: 0.4,
          tempo: 'calm',
          imageryTags: ['sunset', 'horizon'],
          styleHints: ['minimal'],
          pipelinePath: 'direct-semantic',
        },
      }),
    };
    (createMoodAnalyzer as ReturnType<typeof vi.fn>).mockReturnValue(mockMoodAnalyzer);
    (generateArtParams as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce({
        seed: 111111,
        mood: 'serene',
        colors: ['#a8d8ea'],
        backgroundColors: ['#112233'],
        shapeTypes: ['circles'],
        complexity: 3,
        motionSpeed: 2,
        chaosLevel: 2,
        rotationVariance: 45,
        sizeCurve: 0.5,
        positionBias: 'center',
        strokeWidth: 2,
        layerCount: 1,
      })
      .mockReturnValueOnce({
        seed: 222222,
        mood: 'serene',
        colors: ['#ffaa66'],
        backgroundColors: ['#111122'],
        shapeTypes: ['waves'],
        complexity: 4,
        motionSpeed: 3,
        chaosLevel: 2,
        rotationVariance: 65,
        sizeCurve: 0.7,
        positionBias: 'edge',
        strokeWidth: 3,
        layerCount: 2,
      });

    const handler = (await import('@/app/api/art/generate/route')).POST;

    const request = new NextRequest('http://localhost/api/art/generate', {
      method: 'POST',
      body: JSON.stringify({ keyword: 'sunset', optionCount: 2 }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await handler(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.options).toHaveLength(2);
    expect(data.options[0]).toHaveProperty('label', 'Option A');
    expect(data.options[1]).toHaveProperty('label', 'Option B');
    expect(data.artParams).toEqual(data.options[0].artParams);
  });

  it('returns 400 when keyword is missing', async () => {
    const handler = (await import('@/app/api/art/generate/route')).POST;

    const request = new NextRequest('http://localhost/api/art/generate', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await handler(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'Keyword is required');
  });

  it('returns 400 when keyword is empty', async () => {
    const handler = (await import('@/app/api/art/generate/route')).POST;

    const request = new NextRequest('http://localhost/api/art/generate', {
      method: 'POST',
      body: JSON.stringify({ keyword: '   ' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await handler(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error', 'Keyword cannot be empty');
  });
});
