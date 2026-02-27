import type { SemanticProfile } from '@/lib/ai';
import type { ArtParams, VariationContext } from '@/lib/art/types';
import { createBaseParams, getMoodComplexityFloor } from '@/lib/art-generator/base';
import { buildVariationMeta, computeOptionDistance, summarizeVariation } from '@/lib/art-generator/distance';
import { applyControlledVariation, resolveSeed } from '@/lib/art-generator/variation';

export type { ArtParams, VariationContext };
export { computeOptionDistance, summarizeVariation, buildVariationMeta, getMoodComplexityFloor };

export function generateArtParams(
  mood: string,
  keyword?: string,
  semanticProfile?: SemanticProfile,
  variationContext?: VariationContext
): ArtParams {
  const seed = resolveSeed(keyword, variationContext);
  const baseParams = createBaseParams(mood, keyword, semanticProfile, seed);

  if (!variationContext || variationContext.mode !== 'compare-controlled') {
    return baseParams;
  }

  return applyControlledVariation(baseParams, keyword, semanticProfile, variationContext);
}

export function artParamsToJSON(params: ArtParams): string {
  return JSON.stringify(params);
}

export function jsonToArtParams(json: string): ArtParams {
  return JSON.parse(json) as ArtParams;
}
