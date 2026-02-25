export function seededRandom(seed: number, min = 0, max = 1): number {
  const x = Math.sin(seed) * 10000;
  const fraction = x - Math.floor(x);
  return min + fraction * (max - min);
}

function fract(value: number): number {
  return value - Math.floor(value);
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

export function noise2D(seed: number, x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  const n00 = fract(Math.sin(seed * 0.11 + x0 * 127.1 + y0 * 311.7) * 43758.5453);
  const n10 = fract(Math.sin(seed * 0.11 + x1 * 127.1 + y0 * 311.7) * 43758.5453);
  const n01 = fract(Math.sin(seed * 0.11 + x0 * 127.1 + y1 * 311.7) * 43758.5453);
  const n11 = fract(Math.sin(seed * 0.11 + x1 * 127.1 + y1 * 311.7) * 43758.5453);

  const sx = smoothstep(x - x0);
  const sy = smoothstep(y - y0);

  const nx0 = n00 + (n10 - n00) * sx;
  const nx1 = n01 + (n11 - n01) * sx;
  return nx0 + (nx1 - nx0) * sy;
}

export function fbm2D(
  seed: number,
  x: number,
  y: number,
  octaves: number,
  lacunarity: number,
  gain: number
): number {
  let amplitude = 0.5;
  let frequency = 1;
  let sum = 0;
  let norm = 0;

  for (let i = 0; i < octaves; i++) {
    sum += noise2D(seed + i * 31, x * frequency, y * frequency) * amplitude;
    norm += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return norm > 0 ? sum / norm : 0;
}

export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 'rgba(0,0,0,0.5)';
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgb(${r},${g},${b})`;
}
