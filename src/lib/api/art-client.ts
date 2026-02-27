import type { ArtParams } from '@/lib/art/types';
import type { ArtworkData, ListArtworksResponse, PreviewData } from '@/lib/api/types';

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    typeof (payload as { error?: unknown }).error === 'string'
  ) {
    return (payload as { error: string }).error;
  }

  return fallback;
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit, fallbackError = 'Request failed'): Promise<T> {
  const response = await fetch(input, init);

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, fallbackError));
  }

  return payload as T;
}

export async function generateArt(keyword: string, optionCount = 2): Promise<PreviewData> {
  return requestJson<PreviewData>(
    '/api/art/generate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, optionCount }),
    },
    'Failed to generate art'
  );
}

export async function saveArt(data: { keyword: string; mood: string; artParams: ArtParams }): Promise<ArtworkData> {
  return requestJson<ArtworkData>(
    '/api/art/save',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword: data.keyword,
        mood: data.mood,
        artData: data.artParams,
        format: 'svg',
      }),
    },
    'Failed to save art'
  );
}

export async function listArtworks(params?: { limit?: number; offset?: number }): Promise<ListArtworksResponse> {
  const search = new URLSearchParams();
  if (typeof params?.limit === 'number') {
    search.set('limit', String(params.limit));
  }
  if (typeof params?.offset === 'number') {
    search.set('offset', String(params.offset));
  }

  const qs = search.toString();
  return requestJson<ListArtworksResponse>(`/api/art${qs ? `?${qs}` : ''}`, undefined, 'Failed to fetch artworks');
}

export async function getArtwork(id: string): Promise<ArtworkData> {
  return requestJson<ArtworkData>(`/api/art/${id}`, undefined, 'Artwork not found');
}

export async function deleteArtwork(id: string): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(`/api/art/${id}`, { method: 'DELETE' }, 'Failed to delete artwork');
}
