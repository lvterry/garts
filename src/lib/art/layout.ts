import type { ArtParams, LayoutAlgorithm, RenderAlgorithm, ShapeStyle } from '@/lib/art/types';

const LAYOUT_ALGORITHMS: Array<Exclude<LayoutAlgorithm, 'legacy'>> = [
  'flow-field',
  'voronoi',
  'delaunay',
  'attractors',
];

const SHAPE_STYLES: ShapeStyle[] = ['linework', 'point-cloud', 'mesh'];

export function renderToLayoutAlgorithm(value?: RenderAlgorithm): LayoutAlgorithm {
  switch (value) {
    case 'flow-field-particles':
      return 'flow-field';
    case 'voronoi-gradients':
      return 'voronoi';
    case 'delaunay-depth-blur':
      return 'delaunay';
    case 'particles-attractors':
      return 'attractors';
    default:
      return 'legacy';
  }
}

export function layoutToRenderAlgorithm(value?: LayoutAlgorithm): RenderAlgorithm {
  switch (value) {
    case 'flow-field':
      return 'flow-field-particles';
    case 'voronoi':
      return 'voronoi-gradients';
    case 'delaunay':
      return 'delaunay-depth-blur';
    case 'attractors':
      return 'particles-attractors';
    default:
      return 'legacy-shapes';
  }
}

export function resolveLayoutAlgorithm(params: Pick<ArtParams, 'layoutAlgorithm' | 'renderAlgorithm'>): LayoutAlgorithm {
  if (params.layoutAlgorithm && (params.layoutAlgorithm === 'legacy' || LAYOUT_ALGORITHMS.includes(params.layoutAlgorithm))) {
    return params.layoutAlgorithm;
  }

  return renderToLayoutAlgorithm(params.renderAlgorithm);
}

export function isLegacyLayout(layout: LayoutAlgorithm): boolean {
  return layout === 'legacy';
}

function defaultShapeStyleForLayout(layout: LayoutAlgorithm): ShapeStyle {
  switch (layout) {
    case 'flow-field':
      return 'linework';
    case 'voronoi':
      return 'mesh';
    case 'delaunay':
      return 'mesh';
    case 'attractors':
      return 'point-cloud';
    default:
      return 'linework';
  }
}

export function resolveShapeStyle(
  shapeStyle: ArtParams['shapeStyle'],
  layout: LayoutAlgorithm
): ShapeStyle {
  return shapeStyle && SHAPE_STYLES.includes(shapeStyle) ? shapeStyle : defaultShapeStyleForLayout(layout);
}
