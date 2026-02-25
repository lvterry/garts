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

  for (let i = 0; i < particleCount; i++) {
    let x = seededRandom(params.seed + 11 * (i + 1), 0, width);
    let y = seededRandom(params.seed + 17 * (i + 1), 0, height);

    let path = `M ${x.toFixed(2)} ${y.toFixed(2)}`;

    for (let step = 0; step < stepCount; step++) {
      const n = fbm2D(params.seed + i * 13, x * scale, y * scale, octaves, lacunarity, gain);
      const angle = n * Math.PI * 2 * fieldStrength;
      const stride = 1 + params.motionSpeed * 0.8;

      x += Math.cos(angle) * stride;
      y += Math.sin(angle) * stride;

      if (x < -8 || x > width + 8 || y < -8 || y > height + 8) {
        break;
      }

      path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    }

    const color = params.colors[i % params.colors.length] ?? '#ffffff';
    const opacity = 0.14 + (i / Math.max(1, particleCount - 1)) * 0.38;

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
