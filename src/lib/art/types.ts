export type PaletteFamily =
  | 'coolors-inspired'
  | 'chromotome-inspired'
  | 'generativepalettes-inspired';

export type RenderAlgorithm =
  | 'flow-field-particles'
  | 'voronoi-gradients'
  | 'delaunay-depth-blur'
  | 'particles-attractors'
  | 'legacy-shapes';

export type LayoutAlgorithm = 'flow-field' | 'voronoi' | 'delaunay' | 'attractors' | 'legacy';
export type ShapeStyle = 'linework' | 'point-cloud' | 'mesh';

export interface ArtParams {
  seed: number;
  mood: string;
  colors: string[];
  backgroundColors: string[];
  shapeTypes: string[];
  complexity: number;
  motionSpeed: number;
  chaosLevel: number;
  rotationVariance: number;
  sizeCurve: number;
  positionBias: 'center' | 'edge' | 'uniform';
  strokeWidth: number;
  layerCount: number;
  renderAlgorithm?: RenderAlgorithm;
  layoutAlgorithm?: LayoutAlgorithm;
  shapeStyle?: ShapeStyle;
  paletteId?: string;
  paletteFamily?: PaletteFamily;
  noisePlacement?: {
    scale: number;
    strength: number;
    octaves: number;
    lacunarity: number;
    gain: number;
  };
  algorithmConfig?: {
    particleCount?: number;
    stepCount?: number;
    siteCount?: number;
    attractorCount?: number;
    blurLayers?: number;
  };
}

export interface VariationContext {
  optionIndex: number;
  optionCount: number;
  baseSeed: number;
  mode: 'compare-controlled';
  strength?: number;
}
