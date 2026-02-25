import type { ArtParams } from '@/components/SvgArtCanvas';

export interface RendererResult {
  defs: JSX.Element[];
  elements: JSX.Element[];
}

export interface RendererContext {
  params: ArtParams;
  width: number;
  height: number;
}
