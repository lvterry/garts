'use client';

export interface ArtParams {
  seed: number;
  mood: string;
  colors: string[];
  shapeType: 'circles' | 'triangles' | 'lines' | 'spirals' | 'waves';
  complexity: number;
  motionSpeed: number;
  chaosLevel: number;
}

interface SvgArtCanvasProps {
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

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0,0,0,0.5)`;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgb(${r},${g},${b})`;
}

export default function SvgArtCanvas({ params, width = 500, height = 500 }: SvgArtCanvasProps) {
  const { seed, colors, shapeType, complexity, chaosLevel } = params;
  
  const numShapes = complexity * 8;
  const chaos = chaosLevel * 2;

  const renderShapes = () => {
    const elements: JSX.Element[] = [];
    const numShapes = complexity * 8;

    if (shapeType === 'waves') {
      for (let layer = 0; layer < complexity; layer++) {
        const color = colors[layer % colors.length];
        const yOffset = (height / complexity) * layer + 50;
        const amplitude = 30 + layer * 10;
        const frequency = 0.01 + layer * 0.002;
        
        let pathD = '';
        for (let x = 0; x <= width; x += 5) {
          const y = yOffset + Math.sin(x * frequency) * amplitude;
          pathD += x === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
        }
        
        elements.push(
          <path
            key={`wave-${layer}`}
            d={pathD}
            stroke={color}
            strokeWidth={2}
            fill="none"
            opacity={0.6}
          />
        );
      }
      return elements;
    }

    for (let i = 0; i < numShapes; i++) {
      const localSeed = seed + i;
      
      const baseX = seededRandom(localSeed * 100, 0, width);
      const baseY = seededRandom(localSeed * 200, 0, height);
      const size = seededRandom(localSeed * 300, 20, 80 + complexity * 10);
      
      const offsetX = seededNoise(localSeed * 10, 0) * chaos * 10 - chaos * 5;
      const offsetY = seededNoise(localSeed * 10, 100) * chaos * 10 - chaos * 5;
      
      const x = baseX + offsetX;
      const y = baseY + offsetY;
      const color = colors[i % colors.length];
      const opacity = (i / numShapes) * 0.55 + 0.45;

      switch (shapeType) {
        case 'circles':
          elements.push(
            <circle
              key={`circle-${i}`}
              cx={x}
              cy={y}
              r={size / 2}
              fill={hexToRgb(color)}
              opacity={opacity}
            />
          );
          break;

        case 'triangles': {
          const rotation = seededRandom(localSeed, 0, 2 * Math.PI);
          const radius = size / 2;
          const vertices = 3;
          let points = '';
          for (let j = 0; j < vertices; j++) {
            const angle = (2 * Math.PI / vertices) * j + rotation;
            const vx = x + Math.cos(angle) * radius;
            const vy = y + Math.sin(angle) * radius;
            points += `${vx},${vy} `;
          }
          elements.push(
            <polygon
              key={`triangle-${i}`}
              points={points.trim()}
              fill={hexToRgb(color)}
              opacity={opacity}
            />
          );
          break;
        }

        case 'lines': {
          const angle = seededRandom(localSeed, 0, 2 * Math.PI);
          const len = size * 2;
          const x2 = x + Math.cos(angle) * len;
          const y2 = y + Math.sin(angle) * len;
          const strokeWidth = seededRandom(localSeed + 1, 1, 4);
          elements.push(
            <line
              key={`line-${i}`}
              x1={x}
              y1={y}
              x2={x2}
              y2={y2}
              stroke={hexToRgb(color)}
              strokeWidth={strokeWidth}
              opacity={opacity}
            />
          );
          break;
        }

        case 'spirals': {
          const maxRadius = size;
          const turns = seededRandom(localSeed, 3, 8);
          let pathD = '';
          for (let t = 0; t <= turns * 2 * Math.PI; t += 0.1) {
            const r = (t / (turns * 2 * Math.PI)) * maxRadius;
            const vx = x + Math.cos(t) * r;
            const vy = y + Math.sin(t) * r;
            pathD += t === 0 ? `M ${vx} ${vy}` : ` L ${vx} ${vy}`;
          }
          elements.push(
            <path
              key={`spiral-${i}`}
              d={pathD}
              stroke={hexToRgb(color)}
              strokeWidth={2}
              fill="none"
              opacity={opacity}
            />
          );
          break;
        }
      }
    }

    return elements;
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        borderRadius: 12,
        backgroundColor: '#18181b',
      }}
    >
      {renderShapes()}
    </svg>
  );
}
