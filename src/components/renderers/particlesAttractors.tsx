import type { RendererContext, RendererResult } from '@/components/renderers/types';
import { fbm2D, hexToRgb, seededRandom } from '@/components/renderers/utils';

export function renderParticlesAttractors({ params, width, height }: RendererContext): RendererResult {
  const attractorCount = params.algorithmConfig?.attractorCount ?? 4;
  const particleCount = params.algorithmConfig?.particleCount ?? 150;
  const stepCount = params.algorithmConfig?.stepCount ?? 30;
  const scale = params.noisePlacement?.scale ?? 0.007;
  const octaves = params.noisePlacement?.octaves ?? 3;
  const lacunarity = params.noisePlacement?.lacunarity ?? 2;
  const gain = params.noisePlacement?.gain ?? 0.5;

  const attractors: Array<{ x: number; y: number; force: number }> = [];
  for (let i = 0; i < attractorCount; i++) {
    attractors.push({
      x: seededRandom(params.seed + i * 211, width * 0.15, width * 0.85),
      y: seededRandom(params.seed + i * 257, height * 0.15, height * 0.85),
      force: seededRandom(params.seed + i * 263, 0.6, 1.7),
    });
  }

  const elements: JSX.Element[] = [];

  for (let i = 0; i < particleCount; i++) {
    let x = seededRandom(params.seed + i * 13, 0, width);
    let y = seededRandom(params.seed + i * 17, 0, height);
    let vx = 0;
    let vy = 0;

    let d = `M ${x.toFixed(2)} ${y.toFixed(2)}`;

    for (let step = 0; step < stepCount; step++) {
      let fx = 0;
      let fy = 0;

      for (const attractor of attractors) {
        const dx = attractor.x - x;
        const dy = attractor.y - y;
        const distSq = Math.max(12, dx * dx + dy * dy);
        const pull = (attractor.force * 22) / distSq;
        fx += dx * pull;
        fy += dy * pull;
      }

      const field = fbm2D(params.seed + 877, x * scale, y * scale, octaves, lacunarity, gain) - 0.5;
      fx += Math.cos(field * Math.PI * 2) * 0.55;
      fy += Math.sin(field * Math.PI * 2) * 0.55;

      vx = (vx + fx) * 0.92;
      vy = (vy + fy) * 0.92;

      x += vx;
      y += vy;

      if (x < -10 || x > width + 10 || y < -10 || y > height + 10) {
        break;
      }

      d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    }

    elements.push(
      <path
        key={`attractor-path-${i}`}
        d={d}
        fill="none"
        stroke={hexToRgb(params.colors[i % params.colors.length] ?? '#ffffff')}
        strokeWidth={Math.max(0.8, params.strokeWidth * 0.5)}
        opacity={0.08 + (i / Math.max(1, particleCount - 1)) * 0.35}
        strokeLinecap="round"
      />
    );
  }

  for (let i = 0; i < attractors.length; i++) {
    const attractor = attractors[i];
    elements.push(
      <circle
        key={`attractor-${i}`}
        cx={attractor.x}
        cy={attractor.y}
        r={2.5 + i * 0.4}
        fill={params.colors[(i + 1) % params.colors.length] ?? '#ffffff'}
        opacity={0.35}
      />
    );
  }

  return { defs: [], elements };
}
