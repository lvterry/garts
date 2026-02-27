import { afterEach, describe, expect, it, vi } from 'vitest';
import { deleteArtwork, generateArt, getArtwork, listArtworks, saveArt } from '@/lib/api/art-client';

describe('art client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns parsed payloads for successful requests', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ keyword: 'sunset', mood: 'serene', artParams: { seed: 1 } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: '1', keyword: 'sunset', mood: 'serene', artData: {}, createdAt: '2026-01-01' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ artworks: [], total: 0, limit: 50, offset: 0 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: '1', keyword: 'sunset', mood: 'serene', artData: {}, createdAt: '2026-01-01' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    vi.stubGlobal('fetch', fetchMock);

    const preview = await generateArt('sunset', 2);
    const saved = await saveArt({
      keyword: 'sunset',
      mood: 'serene',
      artParams: {
        seed: 1,
        mood: 'serene',
        colors: ['#fff'],
        backgroundColors: ['#000'],
        shapeTypes: ['circles'],
        complexity: 3,
        motionSpeed: 2,
        chaosLevel: 2,
        rotationVariance: 45,
        sizeCurve: 0.5,
        positionBias: 'center',
        strokeWidth: 2,
        layerCount: 1,
      },
    });
    const list = await listArtworks();
    const item = await getArtwork('1');
    const deleted = await deleteArtwork('1');

    expect(preview.keyword).toBe('sunset');
    expect(saved.id).toBe('1');
    expect(list.total).toBe(0);
    expect(item.id).toBe('1');
    expect(deleted.success).toBe(true);
  });

  it('throws normalized error message for failed requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'boom' }) });
    vi.stubGlobal('fetch', fetchMock);

    await expect(generateArt('storm')).rejects.toThrow('boom');
  });
});
