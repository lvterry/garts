import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

describe('POST /api/art/generate', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns art preview data when given a valid keyword', async () => {
    const { createMoodAnalyzer } = await import('@/lib/ai');
    const { generateArtParams, artParamsToJSON } = await import('@/lib/art-generator');

    const mockMoodAnalyzer = {
      extractMood: vi.fn().mockResolvedValue({ mood: 'serene' }),
    };
    (createMoodAnalyzer as ReturnType<typeof vi.fn>).mockReturnValue(mockMoodAnalyzer);
    (generateArtParams as ReturnType<typeof vi.fn>).mockReturnValue({
      seed: 123456,
      mood: 'serene',
      colors: ['#a8d8ea'],
      shapeType: 'circles',
      complexity: 3,
      motionSpeed: 2,
      chaosLevel: 2,
    });
    (artParamsToJSON as ReturnType<typeof vi.fn>).mockReturnValue('{"seed":123456,"mood":"serene","colors":["#a8d8ea"],"shapeType":"circles","complexity":3,"motionSpeed":2,"chaosLevel":2}');

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
    expect(data).toHaveProperty('artData');
    expect(data.artData).toHaveProperty('seed');
    expect(data.artData).toHaveProperty('colors');
    expect(data.artData).toHaveProperty('shapeType');
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
