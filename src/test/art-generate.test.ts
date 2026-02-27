import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

describe('POST /api/art/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      shapeTypes: ['waves'],
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
    expect(data.artParams.shapeTypes).toContain('waves');
    expect(data.artParams).toHaveProperty('positionBias', 'center');
  });

  it('returns multiple options and keeps artParams compatible with the first option', async () => {
    const { createMoodAnalyzer } = await import('@/lib/ai');
    const { computeOptionDistance, generateArtParams, summarizeVariation } = await import('@/lib/art-generator');

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
    (computeOptionDistance as ReturnType<typeof vi.fn>).mockReturnValue(0.52);
    (summarizeVariation as ReturnType<typeof vi.fn>).mockReturnValue('complexity:+1, layerCount:+1');

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
    expect(data.options[1]).toHaveProperty('meta.optionDistance', 0.52);
    expect(data.options[1]).toHaveProperty('meta.variationSummary', 'complexity:+1, layerCount:+1');

    const nonColorKeys: Array<keyof typeof data.options[0]['artParams']> = [
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
    const changedCount = nonColorKeys.filter((key) => {
      const left = data.options[0].artParams[key];
      const right = data.options[1].artParams[key];
      return JSON.stringify(left) !== JSON.stringify(right);
    }).length;
    expect(changedCount).toBeGreaterThanOrEqual(1);
  });

  it('retries second option with stronger variation when option distance is too small', async () => {
    const { createMoodAnalyzer } = await import('@/lib/ai');
    const { computeOptionDistance, generateArtParams, summarizeVariation } = await import('@/lib/art-generator');

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
        seed: 333333,
        mood: 'serene',
        colors: ['#ffaa66'],
        backgroundColors: ['#111122'],
        shapeTypes: ['waves'],
        complexity: 5,
        motionSpeed: 4,
        chaosLevel: 4,
        rotationVariance: 85,
        sizeCurve: 0.8,
        positionBias: 'edge',
        strokeWidth: 4,
        layerCount: 2,
      });
    (computeOptionDistance as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(0.12)
      .mockReturnValueOnce(0.48)
      .mockReturnValueOnce(0.48);
    (summarizeVariation as ReturnType<typeof vi.fn>).mockReturnValue('recovered with stronger variation');

    const handler = (await import('@/app/api/art/generate/route')).POST;
    const request = new NextRequest('http://localhost/api/art/generate', {
      method: 'POST',
      body: JSON.stringify({ keyword: 'sunset', optionCount: 2 }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await handler(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.options).toHaveLength(2);
    expect((generateArtParams as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(3);
    expect(data.options[1].artParams.seed).toBe(333333);
    expect(data.options[1]).toHaveProperty('meta.optionDistance', 0.48);
  });

  it('caps variation retries to avoid unbounded regeneration', async () => {
    const { createMoodAnalyzer } = await import('@/lib/ai');
    const { computeOptionDistance, generateArtParams, summarizeVariation } = await import('@/lib/art-generator');

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
        seed: 333333,
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
        seed: 444444,
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
        seed: 555555,
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
    (computeOptionDistance as ReturnType<typeof vi.fn>).mockReturnValue(0.12);
    (summarizeVariation as ReturnType<typeof vi.fn>).mockReturnValue('distance remained below threshold');

    const handler = (await import('@/app/api/art/generate/route')).POST;
    const request = new NextRequest('http://localhost/api/art/generate', {
      method: 'POST',
      body: JSON.stringify({ keyword: 'sunset', optionCount: 2 }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await handler(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.options).toHaveLength(2);
    expect((generateArtParams as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(5);
    expect(data.options[1].artParams.seed).toBe(555555);
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
