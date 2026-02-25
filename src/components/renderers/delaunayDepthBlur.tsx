import { Delaunay } from 'd3-delaunay';
import type { RendererContext, RendererResult } from '@/components/renderers/types';
import { fbm2D, seededRandom } from '@/components/renderers/utils';

export function renderDelaunayDepthBlur({ params, width, height }: RendererContext): RendererResult {
  const count = params.algorithmConfig?.siteCount ?? 68;
  const blurLayers = Math.max(2, params.algorithmConfig?.blurLayers ?? 3);
  const scale = params.noisePlacement?.scale ?? 0.006;
  const octaves = params.noisePlacement?.octaves ?? 3;
  const lacunarity = params.noisePlacement?.lacunarity ?? 2;
  const gain = params.noisePlacement?.gain ?? 0.5;

  const points: Array<[number, number]> = [];
  for (let i = 0; i < count; i++) {
    points.push([
      seededRandom(params.seed + i * 19, 0, width),
      seededRandom(params.seed + i * 23, 0, height),
    ]);
  }

  const delaunay = Delaunay.from(points);
  const defs: JSX.Element[] = [];
  for (let layer = 0; layer < blurLayers; layer++) {
    const id = `depth-blur-${params.seed}-${layer}`;
    defs.push(
      <filter key={id} id={id} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation={layer * 0.9} />
      </filter>
    );
  }

  const elements: JSX.Element[] = [];
  const triangles = delaunay.triangles;

  for (let i = 0; i < triangles.length; i += 3) {
    const a = points[triangles[i]];
    const b = points[triangles[i + 1]];
    const c = points[triangles[i + 2]];

    const cx = (a[0] + b[0] + c[0]) / 3;
    const cy = (a[1] + b[1] + c[1]) / 3;

    const depth = fbm2D(params.seed + 701, cx * scale, cy * scale, octaves, lacunarity, gain);
    const layerIndex = Math.min(blurLayers - 1, Math.floor(depth * blurLayers));

    const color = params.colors[(i / 3) % params.colors.length];
    const opacity = 0.18 + (1 - depth) * 0.45;

    elements.push(
      <polygon
        key={`tri-${i}`}
        points={`${a[0].toFixed(2)},${a[1].toFixed(2)} ${b[0].toFixed(2)},${b[1].toFixed(2)} ${c[0].toFixed(2)},${c[1].toFixed(2)}`}
        fill={color}
        opacity={opacity}
        filter={`url(#depth-blur-${params.seed}-${layerIndex})`}
      />
    );
  }

  return { defs, elements };
}
