function fract(value: number): number {
  return value - Math.floor(value);
}

function hash2(seed: number, x: number, y: number): number {
  const n = Math.sin(seed * 0.017 + x * 127.1 + y * 311.7) * 43758.5453123;
  return fract(n);
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

export function noise2D(seed: number, x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  const sx = smoothstep(x - x0);
  const sy = smoothstep(y - y0);

  const n00 = hash2(seed, x0, y0);
  const n10 = hash2(seed, x1, y0);
  const n01 = hash2(seed, x0, y1);
  const n11 = hash2(seed, x1, y1);

  const ix0 = n00 + (n10 - n00) * sx;
  const ix1 = n01 + (n11 - n01) * sx;

  return ix0 + (ix1 - ix0) * sy;
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
    sum += noise2D(seed + i * 37, x * frequency, y * frequency) * amplitude;
    norm += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }

  if (norm === 0) {
    return 0;
  }

  return sum / norm;
}
