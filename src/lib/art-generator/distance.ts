import { resolveLayoutAlgorithm, resolveShapeStyle } from '@/lib/art/layout';
import type { ArtParams } from '@/lib/art/types';

function shapeDistance(left: string[], right: string[]): number {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const union = new Set([...Array.from(leftSet), ...Array.from(rightSet)]);
  if (union.size === 0) {
    return 0;
  }

  const intersectionCount = Array.from(leftSet).filter((shape) => rightSet.has(shape)).length;
  return 1 - intersectionCount / union.size;
}

export function computeOptionDistance(a: ArtParams, b: ArtParams): number {
  const leftLayout = resolveLayoutAlgorithm(a);
  const rightLayout = resolveLayoutAlgorithm(b);
  const leftShapeStyle = resolveShapeStyle(a.shapeStyle, leftLayout);
  const rightShapeStyle = resolveShapeStyle(b.shapeStyle, rightLayout);
  const noiseDelta =
    a.noisePlacement && b.noisePlacement
      ? (
          Math.abs(a.noisePlacement.scale - b.noisePlacement.scale) * 35 +
          Math.abs(a.noisePlacement.strength - b.noisePlacement.strength) / 2 +
          Math.abs(a.noisePlacement.octaves - b.noisePlacement.octaves) / 4 +
          Math.abs(a.noisePlacement.lacunarity - b.noisePlacement.lacunarity) / 2 +
          Math.abs(a.noisePlacement.gain - b.noisePlacement.gain)
        ) / 5
      : 0;

  const deltas = [
    Math.abs(a.complexity - b.complexity) / 9,
    Math.abs(a.motionSpeed - b.motionSpeed) / 9,
    Math.abs(a.chaosLevel - b.chaosLevel) / 9,
    Math.abs(a.rotationVariance - b.rotationVariance) / 359,
    Math.abs(a.sizeCurve - b.sizeCurve),
    Math.abs(a.strokeWidth - b.strokeWidth) / 6,
    Math.abs(a.layerCount - b.layerCount) / 2,
    a.positionBias === b.positionBias ? 0 : 1,
    shapeDistance(a.shapeTypes, b.shapeTypes),
    leftLayout === rightLayout ? 0 : 1,
    leftShapeStyle === rightShapeStyle ? 0 : 1,
    (a.paletteId ?? '') === (b.paletteId ?? '') ? 0 : 1,
    noiseDelta,
  ];

  return deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;
}

export function summarizeVariation(baseParams: ArtParams, variedParams: ArtParams): string {
  const changes: string[] = [];
  const numberFields: Array<
    keyof Pick<ArtParams, 'complexity' | 'motionSpeed' | 'chaosLevel' | 'rotationVariance' | 'strokeWidth' | 'layerCount'>
  > = ['complexity', 'motionSpeed', 'chaosLevel', 'rotationVariance', 'strokeWidth', 'layerCount'];

  for (const field of numberFields) {
    const delta = variedParams[field] - baseParams[field];
    if (delta !== 0) {
      const sign = delta > 0 ? '+' : '';
      changes.push(`${field}:${sign}${delta}`);
    }
  }

  if (Math.abs(variedParams.sizeCurve - baseParams.sizeCurve) >= 0.05) {
    const sizeDelta = (variedParams.sizeCurve - baseParams.sizeCurve).toFixed(2);
    const sign = variedParams.sizeCurve >= baseParams.sizeCurve ? '+' : '';
    changes.push(`sizeCurve:${sign}${sizeDelta}`);
  }

  if (variedParams.positionBias !== baseParams.positionBias) {
    changes.push(`positionBias:${baseParams.positionBias}->${variedParams.positionBias}`);
  }

  if (shapeDistance(baseParams.shapeTypes, variedParams.shapeTypes) > 0) {
    changes.push(`shapeTypes:${baseParams.shapeTypes.join('|')}->${variedParams.shapeTypes.join('|')}`);
  }

  const baseLayout = resolveLayoutAlgorithm(baseParams);
  const variedLayout = resolveLayoutAlgorithm(variedParams);
  const baseShapeStyle = resolveShapeStyle(baseParams.shapeStyle, baseLayout);
  const variedShapeStyle = resolveShapeStyle(variedParams.shapeStyle, variedLayout);

  if (baseLayout !== variedLayout) {
    changes.push(`layout:${baseLayout}->${variedLayout}`);
  }

  if (baseShapeStyle !== variedShapeStyle) {
    changes.push(`shapeStyle:${baseShapeStyle}->${variedShapeStyle}`);
  }

  if ((baseParams.paletteId ?? '') !== (variedParams.paletteId ?? '')) {
    changes.push(`palette:${baseParams.paletteId ?? 'n/a'}->${variedParams.paletteId ?? 'n/a'}`);
  }

  return changes.length > 0 ? changes.join(', ') : 'no significant variation';
}

export function buildVariationMeta(
  baseParams: ArtParams,
  variedParams: ArtParams
): { variationSummary: string; optionDistance: number } {
  return {
    variationSummary: summarizeVariation(baseParams, variedParams),
    optionDistance: Number(computeOptionDistance(baseParams, variedParams).toFixed(3)),
  };
}
