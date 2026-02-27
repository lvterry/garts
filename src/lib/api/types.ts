import type { ArtParams } from '@/lib/art/types';

export interface PreviewOption {
  optionId: string;
  label: string;
  artParams: ArtParams;
  meta?: {
    optionDistance?: number;
    variationSummary?: string;
  };
}

export interface PreviewData {
  keyword: string;
  mood: string;
  artParams: ArtParams;
  options?: PreviewOption[];
  debug?: {
    confidence?: number | null;
    semanticProfile?: Record<string, unknown> | null;
    pipelinePath?: 'direct-semantic' | 'expand-then-extract';
    rawModelJson?: Record<string, unknown> | null;
    algorithmSelection?: {
      renderAlgorithm?: string;
      layoutAlgorithm?: string | null;
      shapeStyle?: string | null;
      paletteId?: string | null;
      paletteFamily?: string | null;
    };
  };
}

export interface ArtworkData {
  id: string;
  keyword: string;
  mood: string;
  artData: ArtParams;
  createdAt: string;
  format?: string;
}

export interface ListArtworksResponse {
  artworks: ArtworkData[];
  total: number;
  limit: number;
  offset: number;
}
