import { Delaunay } from 'd3-delaunay';
import type { RendererContext, RendererResult } from '@/components/renderers/types';
import { fbm2D, seededRandom } from '@/components/renderers/utils';

export function renderVoronoiGradients({ params, width, height }: RendererContext): RendererResult {
  const siteCount = params.algorithmConfig?.siteCount ?? 52;
  const scale = params.noisePlacement?.scale ?? 0.005;
  const octaves = params.noisePlacement?.octaves ?? 3;
  const lacunarity = params.noisePlacement?.lacunarity ?? 2;
  const gain = params.noisePlacement?.gain ?? 0.5;

  const sites: Array<[number, number]> = [];
  for (let i = 0; i < siteCount; i++) {
    const baseX = seededRandom(params.seed + i * 31, 20, width - 20);
    const baseY = seededRandom(params.seed + i * 37, 20, height - 20);
    const jitter = (params.noisePlacement?.strength ?? 1) * 22;
    const offsetX = (fbm2D(params.seed + 400, baseX * scale, baseY * scale, octaves, lacunarity, gain) - 0.5) * jitter;
    const offsetY = (fbm2D(params.seed + 800, baseX * scale, baseY * scale, octaves, lacunarity, gain) - 0.5) * jitter;
    sites.push([baseX + offsetX, baseY + offsetY]);
  }

  const delaunay = Delaunay.from(sites);
  const voronoi = delaunay.voronoi([0, 0, width, height]);

  const defs: JSX.Element[] = [];
  const elements: JSX.Element[] = [];
  const shapeStyle = params.shapeStyle ?? 'mesh';

  for (let i = 0; i < sites.length; i++) {
    const polygon = voronoi.cellPolygon(i);
    if (!polygon || polygon.length < 3) {
      continue;
    }

    const [x, y] = sites[i];
    const points = polygon.map((point) => `${point[0].toFixed(2)},${point[1].toFixed(2)}`).join(' ');

    if (shapeStyle === 'point-cloud') {
      elements.push(
        <circle
          key={`voronoi-site-${i}`}
          cx={x}
          cy={y}
          r={Math.max(1.2, params.strokeWidth * 0.5)}
          fill={params.colors[i % params.colors.length]}
          opacity={0.55}
        />
      );
      continue;
    }

    if (shapeStyle === 'linework') {
      elements.push(
        <polygon
          key={`voronoi-wire-${i}`}
          points={points}
          fill="none"
          opacity={0.3}
          stroke={params.colors[i % params.colors.length]}
          strokeWidth={Math.max(0.9, params.strokeWidth * 0.35)}
        />
      );
      continue;
    }

    const gradientId = `voronoi-g-${params.seed}-${i}`;
    const field = fbm2D(params.seed + 991, x * scale, y * scale, octaves, lacunarity, gain);
    const angle = field * Math.PI * 2;
    const radius = 60;

    defs.push(
      <linearGradient
        key={gradientId}
        id={gradientId}
        x1={x - Math.cos(angle) * radius}
        y1={y - Math.sin(angle) * radius}
        x2={x + Math.cos(angle) * radius}
        y2={y + Math.sin(angle) * radius}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor={params.colors[i % params.colors.length]} />
        <stop offset="100%" stopColor={params.colors[(i + 1) % params.colors.length]} />
      </linearGradient>
    );

    elements.push(
      <polygon
        key={`voronoi-cell-${i}`}
        points={points}
        fill={`url(#${gradientId})`}
        opacity={0.22 + (i % 7) * 0.07}
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={0.8}
      />
    );
  }

  return { defs, elements };
}
