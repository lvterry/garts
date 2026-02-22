'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), {
  ssr: false,
});

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

export default function ArtCanvas({ params, width = 500, height = 500 }: ArtCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  const setup = (p5: any) => {
    p5.createCanvas(width, height).parent(canvasRef.current!);
    p5.randomSeed(params.seed);
    p5.noiseSeed(params.seed);
  };

  const draw = (p5: any) => {
    p5.background(24, 24, 27);
    const { colors, shapeType, complexity, motionSpeed, chaosLevel } = params;

    const numShapes = complexity * 8;
    const speed = motionSpeed * 0.5;
    const chaos = chaosLevel * 2;

    for (let i = 0; i < numShapes; i++) {
      p5.push();
      const baseX = p5.random(width);
      const baseY = p5.random(height);
      const size = p5.random(20, 80 + complexity * 10);

      const offsetX = p5.noise(i * 0.1 + p5.frameCount * 0.01 * speed) * chaos * 10 - chaos * 5;
      const offsetY = p5.noise(i * 0.1 + 100 + p5.frameCount * 0.01 * speed) * chaos * 10 - chaos * 5;

      const colorIndex = i % colors.length;
      const col = p5.color(colors[colorIndex]);
      col.setAlpha(p5.map(i, 0, numShapes, 100, 255));
      p5.fill(col);
      p5.noStroke();

      switch (shapeType) {
        case 'circles':
          drawCircle(p5, baseX + offsetX, baseY + offsetY, size, i);
          break;
        case 'triangles':
          drawTriangle(p5, baseX + offsetX, baseY + offsetY, size, i, p5);
          break;
        case 'lines':
          drawLine(p5, baseX + offsetX, baseY + offsetY, size, i, p5);
          break;
        case 'spirals':
          drawSpiral(p5, baseX + offsetX, baseY + offsetY, size, i);
          break;
        case 'waves':
          drawWave(p5, i, width, height, colors, complexity);
          p5.pop();
          return;
      }
      p5.pop();
    }
  };

  const drawCircle = (p5: any, x: number, y: number, size: number, i: number) => {
    const pulse = p5.sin(p5.frameCount * 0.02 + i * 0.5) * 5;
    p5.circle(x, y, size + pulse);
  };

  const drawTriangle = (p5: any, x: number, y: number, size: number, i: number, p5ref: any) => {
    const rotation = p5.frameCount * 0.01 + i * 0.2;
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

  const drawLine = (p5: any, x: number, y: number, size: number, i: number, p5ref: any) => {
    const angle = p5.frameCount * 0.02 + i * 0.3;
    const len = size * 2;
    p5.strokeWeight(p5.random(1, 4));
    p5.line(
      x,
      y,
      x + p5.cos(angle) * len,
      y + p5.sin(angle) * len
    );
  };

  const drawSpiral = (p5: any, x: number, y: number, size: number, i: number) => {
    p5.translate(x, y);
    const maxRadius = size;
    const turns = p5.map(i % 5, 0, 4, 3, 8);
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

  const drawWave = (p5: any, i: number, w: number, h: number, colors: string[], complexity: number) => {
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
        const y = yOffset + p5.sin(x * frequency + p5.frameCount * 0.02) * amplitude;
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
