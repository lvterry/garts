'use client';

import { useEffect, useRef, useState } from 'react';

let Sketch: any = null;
let p5Module: any = null;

export interface ArtParams {
  seed: number;
  mood: string;
  colors: string[];
  shapeType: 'circles' | 'triangles' | 'lines' | 'spirals' | 'waves';
  complexity: number;
  motionSpeed: number;
  chaosLevel: number;
}

interface ArtCanvasProps {
  params: ArtParams;
  width?: number;
  height?: number;
}

function seededRandom(seed: number, min: number, max: number): number {
  const x = Math.sin(seed) * 10000;
  const fraction = x - Math.floor(x);
  return min + fraction * (max - min);
}

function seededNoise(seed: number, x: number, y: number = 0): number {
  const n = Math.sin(seed * 12.9898 + x * 78.233 + y * 43.758) * 43758.5453;
  return n - Math.floor(n);
}

export default function ArtCanvas({ params, width = 500, height = 500 }: ArtCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    async function loadP5() {
      try {
        if (!p5Module) {
          p5Module = await import('react-p5');
          Sketch = p5Module.default;
        }
      } catch (err) {
        console.error('Failed to load p5:', err);
        setError('Failed to load art canvas');
      }
    }
    loadP5();

    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove();
        p5Instance.current = null;
      }
    };
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          width,
          height,
          backgroundColor: '#18181b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#52525b',
        }}
      >
        Loading...
      </div>
    );
  }

  if (error || !Sketch) {
    return (
      <div
        style={{
          width,
          height,
          backgroundColor: '#18181b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#52525b',
          borderRadius: 12,
        }}
      >
        {error || 'Loading canvas...'}
      </div>
    );
  }

  const { seed, colors, shapeType, complexity } = params;

  const setup = (p5: any) => {
    p5Instance.current = p5;
    if (!canvasRef.current) return;
    p5.createCanvas(width, height).parent(canvasRef.current);
    p5.randomSeed(seed);
    p5.noiseSeed(seed);
  };

  const draw = (p5: any) => {
    if (!canvasRef.current) return;
    
    p5.background(24, 24, 27);
    
    const numShapes = complexity * 8;
    const chaos = params.chaosLevel * 2;

    for (let i = 0; i < numShapes; i++) {
      p5.push();
      
      const baseX = seededRandom(seed + i * 100, 0, width);
      const baseY = seededRandom(seed + i * 200, 0, height);
      const size = seededRandom(seed + i * 300, 20, 80 + complexity * 10);

      const offsetX = seededNoise(seed + i * 10, 0) * chaos * 10 - chaos * 5;
      const offsetY = seededNoise(seed + i * 10, 100) * chaos * 10 - chaos * 5;

      const colorIndex = i % colors.length;
      const col = p5.color(colors[colorIndex]);
      col.setAlpha(p5.map(i, 0, numShapes, 100, 255));
      p5.fill(col);
      p5.noStroke();

      switch (shapeType) {
        case 'circles':
          p5.circle(baseX + offsetX, baseY + offsetY, size);
          break;
        case 'triangles':
          drawTriangle(p5, baseX + offsetX, baseY + offsetY, size, seed + i);
          break;
        case 'lines':
          drawLine(p5, baseX + offsetX, baseY + offsetY, size, seed + i);
          break;
        case 'spirals':
          drawSpiral(p5, baseX + offsetX, baseY + offsetY, size, seed + i);
          break;
        case 'waves':
          drawWave(p5, seed + i, width, height, colors, complexity);
          p5.pop();
          return;
      }
      p5.pop();
    }
  };

  const drawTriangle = (p5: any, x: number, y: number, size: number, localSeed: number) => {
    const rotation = seededRandom(localSeed, 0, p5.TWO_PI);
    p5.translate(x, y);
    p5.rotate(rotation);
    const vertices = 3;
    const radius = size / 2;
    p5.beginShape();
    for (let j = 0; j < vertices; j++) {
      const angle = (p5.TWO_PI / vertices) * j;
      const vx = p5.cos(angle) * radius;
      const vy = p5.sin(angle) * radius;
      p5.vertex(vx, vy);
    }
    p5.endShape(p5.CLOSE);
  };

  const drawLine = (p5: any, x: number, y: number, size: number, localSeed: number) => {
    const angle = seededRandom(localSeed, 0, p5.TWO_PI);
    const len = size * 2;
    p5.strokeWeight(seededRandom(localSeed + 1, 1, 4));
    p5.line(
      x,
      y,
      x + p5.cos(angle) * len,
      y + p5.sin(angle) * len
    );
  };

  const drawSpiral = (p5: any, x: number, y: number, size: number, localSeed: number) => {
    p5.translate(x, y);
    const maxRadius = size;
    const turns = seededRandom(localSeed, 3, 8);
    p5.noFill();
    p5.beginShape();
    for (let t = 0; t < turns * p5.TWO_PI; t += 0.1) {
      const r = (t / (turns * p5.TWO_PI)) * maxRadius;
      const vx = p5.cos(t) * r;
      const vy = p5.sin(t) * r;
      p5.vertex(vx, vy);
    }
    p5.endShape();
  };

  const drawWave = (p5: any, localSeed: number, w: number, h: number, colors: string[], complexity: number) => {
    for (let layer = 0; layer < complexity; layer++) {
      const col = p5.color(colors[layer % colors.length]);
      col.setAlpha(150);
      p5.stroke(col);
      p5.noFill();
      p5.strokeWeight(2);
      
      const yOffset = (h / complexity) * layer + 50;
      const amplitude = 30 + layer * 10;
      const frequency = 0.01 + layer * 0.002;
      
      p5.beginShape();
      for (let x = 0; x < w; x += 5) {
        const y = yOffset + Math.sin(x * frequency) * amplitude;
        p5.vertex(x, y);
      }
      p5.endShape();
    }
  };

  return (
    <div
      ref={canvasRef}
      style={{
        width,
        height,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <Sketch setup={setup} draw={draw} />
    </div>
  );
}
