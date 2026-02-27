import type { RendererContext, RendererResult } from '@/components/renderers/types';
import { fbm2D, hexToRgb, seededRandom } from '@/components/renderers/utils';

export function renderFlowFieldParticles({ params, width, height }: RendererContext): RendererResult {
  const particleCount = params.algorithmConfig?.particleCount ?? 130;
  const stepCount = params.algorithmConfig?.stepCount ?? 36;
  const scale = params.noisePlacement?.scale ?? 0.008;
  const fieldStrength = params.noisePlacement?.strength ?? 1.2;
  const octaves = params.noisePlacement?.octaves ?? 3;
  const lacunarity = params.noisePlacement?.lacunarity ?? 2;
  const gain = params.noisePlacement?.gain ?? 0.5;

  const elements: JSX.Element[] = [];
  const shapeStyle = params.shapeStyle ?? 'linework';

  for (let i = 0; i < particleCount; i++) {
    let x = seededRandom(params.seed + 11 * (i + 1), 0, width);
    let y = seededRandom(params.seed + 17 * (i + 1), 0, height);
    const points: Array<{ x: number; y: number }> = [{ x, y }];

    for (let step = 0; step < stepCount; step++) {
      const n = fbm2D(params.seed + i * 13, x * scale, y * scale, octaves, lacunarity, gain);
      const angle = n * Math.PI * 2 * fieldStrength;
      const stride = 1 + params.motionSpeed * 0.8;

      x += Math.cos(angle) * stride;
      y += Math.sin(angle) * stride;

      if (x < -8 || x > width + 8 || y < -8 || y > height + 8) {
        break;
      }

      points.push({ x, y });
    }

    const color = params.colors[i % params.colors.length] ?? '#ffffff';
    const opacity = 0.14 + (i / Math.max(1, particleCount - 1)) * 0.38;
    const path = points
      .map((point, pointIndex) =>
        `${pointIndex === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
      )
      .join(' ');

    if (shapeStyle === 'point-cloud') {
      for (let pointIndex = 0; pointIndex < points.length; pointIndex += 3) {
        const point = points[pointIndex];
        elements.push(
          <circle
            key={`flow-dot-${i}-${pointIndex}`}
            cx={point.x}
            cy={point.y}
            r={Math.max(0.7, params.strokeWidth * 0.35)}
            fill={hexToRgb(color)}
            opacity={opacity * 0.75}
          />
        );
      }
      continue;
    }

    if (shapeStyle === 'mesh') {
      elements.push(
        <path
          key={`flow-ribbon-${i}`}
          d={path}
          fill="none"
          stroke={hexToRgb(color)}
          strokeWidth={Math.max(1.4, params.strokeWidth * 1.1)}
          opacity={opacity * 0.55}
          strokeLinecap="round"
        />
      );
      continue;
    }

    elements.push(
      <path
        key={`flow-${i}`}
        d={path}
        fill="none"
        stroke={hexToRgb(color)}
        strokeWidth={Math.max(0.8, params.strokeWidth * 0.6)}
        opacity={opacity}
        strokeLinecap="round"
      />
    );
  }

  return { defs: [], elements };
}
