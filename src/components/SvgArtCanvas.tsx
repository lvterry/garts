'use client';

export interface ArtParams {
  seed: number;
  mood: string;
  colors: string[];
  backgroundColors: string[];
  shapeTypes: string[];
  complexity: number;
  motionSpeed: number;
  chaosLevel: number;
  rotationVariance: number;
  sizeCurve: number;
  positionBias: 'center' | 'edge' | 'uniform';
  strokeWidth: number;
  layerCount: number;
}

interface SvgArtCanvasProps {
  params: ArtParams;
  width?: number;
  height?: number;
}

const DEFAULT_SIZE = 500;

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

function getPosition(
  localSeed: number,
  chaos: number,
  width: number,
  height: number,
  positionBias: 'center' | 'edge' | 'uniform'
): { x: number; y: number } {
  let baseX: number, baseY: number;
  
  if (positionBias === 'center') {
    const centerX = width / 2;
    const centerY = height / 2;
    const spread = Math.min(width, height) * 0.3;
    baseX = centerX + seededRandom(localSeed * 100, -spread, spread);
    baseY = centerY + seededRandom(localSeed * 200, -spread, spread);
  } else if (positionBias === 'edge') {
    const edge = seededRandom(localSeed * 300, 0, 4);
    const margin = 50;
    if (edge < 1) {
      baseX = seededRandom(localSeed * 400, margin, width - margin);
      baseY = margin;
    } else if (edge < 2) {
      baseX = seededRandom(localSeed * 400, margin, width - margin);
      baseY = height - margin;
    } else if (edge < 3) {
      baseX = margin;
      baseY = seededRandom(localSeed * 400, margin, height - margin);
    } else {
      baseX = width - margin;
      baseY = seededRandom(localSeed * 400, margin, height - margin);
    }
  } else {
    baseX = seededRandom(localSeed * 100, 0, width);
    baseY = seededRandom(localSeed * 200, 0, height);
  }
  
  const offsetX = seededNoise(localSeed * 10, 0) * chaos * 10 - chaos * 5;
  const offsetY = seededNoise(localSeed * 10, 100) * chaos * 10 - chaos * 5;
  
  return {
    x: baseX + offsetX,
    y: baseY + offsetY,
  };
}

function getSize(
  localSeed: number,
  complexity: number,
  sizeCurve: number
): number {
  const baseSize = seededRandom(localSeed * 300, 20, 80 + complexity * 10);
  const normalized = (baseSize - 20) / (60 + complexity * 10);
  if (sizeCurve < 0.3) {
    return baseSize;
  } else if (sizeCurve < 0.7) {
    return 20 + (80 + complexity * 10) * Math.sqrt(normalized);
  } else {
    return 20 + (80 + complexity * 10) * Math.pow(normalized, 2);
  }
}

function renderShapesForType(
  shapeType: string,
  params: ArtParams,
  width: number,
  height: number,
  layerIndex: number,
  totalLayers: number
): JSX.Element[] {
  const { seed, colors, complexity, chaosLevel, rotationVariance, sizeCurve, positionBias, strokeWidth } = params;
  
  const elements: JSX.Element[] = [];
  const numShapes = complexity * 8;
  const shapesPerLayer = Math.ceil(numShapes / totalLayers);
  const startIndex = layerIndex * shapesPerLayer;
  const endIndex = Math.min(startIndex + shapesPerLayer, numShapes);
  const chaos = chaosLevel * 2;
  
  const layerOpacity = 1 - (layerIndex * 0.25);
  
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
          key={`wave-${layer}-l${layerIndex}`}
          d={pathD}
          stroke={hexToRgb(color)}
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.6 * layerOpacity}
        />
      );
    }
    return elements;
  }
  
  for (let i = startIndex; i < endIndex; i++) {
    const localSeed = seed + i + layerIndex * 1000;
    const { x, y } = getPosition(localSeed, chaos, width, height, positionBias);
    const size = getSize(localSeed, complexity, sizeCurve);
    const color = colors[i % colors.length];
    const opacity = ((i - startIndex) / (endIndex - startIndex)) * 0.55 + 0.45;
    
    const rotation = seededRandom(localSeed, 0, rotationVariance * (Math.PI / 180));
    
    switch (shapeType) {
      case 'circles':
        elements.push(
          <circle
            key={`circle-${i}-l${layerIndex}`}
            cx={x}
            cy={y}
            r={size / 2}
            fill={hexToRgb(color)}
            opacity={opacity * layerOpacity}
          />
        );
        break;

      case 'triangles': {
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
            key={`triangle-${i}-l${layerIndex}`}
            points={points.trim()}
            fill={hexToRgb(color)}
            opacity={opacity * layerOpacity}
          />
        );
        break;
      }

      case 'lines': {
        const angle = seededRandom(localSeed, 0, 2 * Math.PI) + rotation;
        const len = size * 2;
        const x2 = x + Math.cos(angle) * len;
        const y2 = y + Math.sin(angle) * len;
        const sw = seededRandom(localSeed + 1, 1, strokeWidth);
        elements.push(
          <line
            key={`line-${i}-l${layerIndex}`}
            x1={x}
            y1={y}
            x2={x2}
            y2={y2}
            stroke={hexToRgb(color)}
            strokeWidth={sw}
            opacity={opacity * layerOpacity}
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
          const vx = x + Math.cos(t + rotation) * r;
          const vy = y + Math.sin(t + rotation) * r;
          pathD += t === 0 ? `M ${vx} ${vy}` : ` L ${vx} ${vy}`;
        }
        elements.push(
          <path
            key={`spiral-${i}-l${layerIndex}`}
            d={pathD}
            stroke={hexToRgb(color)}
            strokeWidth={strokeWidth}
            fill="none"
            opacity={opacity * layerOpacity}
          />
        );
        break;
      }
    }
  }
  
  return elements;
}

export default function SvgArtCanvas({ params }: SvgArtCanvasProps) {
  const width = DEFAULT_SIZE;
  const height = DEFAULT_SIZE;
  const { backgroundColors, shapeTypes, layerCount } = params;
  
  const bgColor = backgroundColors?.[0] || '#0a0a12';
  
  const shapeLayerOrder = ['waves', 'circles', 'spirals', 'triangles', 'lines'];
  const sortedShapes = [...shapeTypes].sort((a, b) => 
    shapeLayerOrder.indexOf(a) - shapeLayerOrder.indexOf(b)
  );
  
  const renderAllLayers = () => {
    const allElements: JSX.Element[] = [];
    
    for (let layer = 0; layer < layerCount; layer++) {
      for (const shapeType of sortedShapes) {
        const layerElements = renderShapesForType(
          shapeType,
          params,
          width,
          height,
          layer,
          layerCount
        );
        allElements.push(...layerElements);
      }
    }
    
    return allElements;
  };
  
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{
        display: 'block',
        backgroundColor: bgColor,
      }}
    >
      <rect x="0" y="0" width={width} height={height} fill={bgColor} opacity={0.9} />
      
      {renderAllLayers()}
    </svg>
  );
}
