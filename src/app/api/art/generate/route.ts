import { NextRequest, NextResponse } from 'next/server';
import { createMoodAnalyzer } from '@/lib/ai';
import { computeOptionDistance, generateArtParams, summarizeVariation } from '@/lib/art-generator';

export const dynamic = 'force-dynamic';
const MIN_OPTION_DISTANCE = 0.28;
const STRENGTH_PRESETS = [0.25, 0.55, 0.75, 0.9];
const RETRY_STRENGTH_BOOST = 0.25;
const MAX_VARIATION_RETRIES = 3;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, optionCount } = body;

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    const trimmedKeyword = keyword.trim();
    if (trimmedKeyword.length === 0) {
      return NextResponse.json(
        { error: 'Keyword cannot be empty' },
        { status: 400 }
      );
    }

    const analyzer = createMoodAnalyzer();
    const moodResult = await analyzer.extractMood(trimmedKeyword);

    const requestedCount = typeof optionCount === 'number' ? optionCount : 1;
    const safeOptionCount = Math.min(4, Math.max(1, Math.floor(requestedCount)));

    const baseSeed = Math.floor(Math.random() * 1000000);
    const options: Array<{
      optionId: string;
      label: string;
      artParams: ReturnType<typeof generateArtParams>;
      meta: {
        optionDistance: number;
        variationSummary: string;
      };
    }> = [];

    for (let index = 0; index < safeOptionCount; index++) {
      const defaultStrength = STRENGTH_PRESETS[Math.min(index, STRENGTH_PRESETS.length - 1)];
      let strength = defaultStrength;
      let generatedParams = generateArtParams(
        moodResult.mood,
        trimmedKeyword,
        moodResult.semanticProfile,
        safeOptionCount > 1
          ? {
              optionIndex: index,
              optionCount: safeOptionCount,
              baseSeed,
              mode: 'compare-controlled',
              strength,
            }
          : undefined
      );

      if (safeOptionCount > 1 && index > 0 && options[0]) {
        let distance = computeOptionDistance(options[0].artParams, generatedParams);
        let retries = 0;

        while (distance < MIN_OPTION_DISTANCE && retries < MAX_VARIATION_RETRIES) {
          strength = Math.min(1, strength + RETRY_STRENGTH_BOOST);
          generatedParams = generateArtParams(
            moodResult.mood,
            trimmedKeyword,
            moodResult.semanticProfile,
            {
              optionIndex: index,
              optionCount: safeOptionCount,
              baseSeed,
              mode: 'compare-controlled',
              strength,
            }
          );
          distance = computeOptionDistance(options[0].artParams, generatedParams);
          retries += 1;
        }
      }

      options.push({
        optionId: `${generatedParams.seed}-${index}`,
        label: `Option ${String.fromCharCode(65 + index)}`,
        artParams: generatedParams,
        meta: options[0]
          ? {
              optionDistance: Number(computeOptionDistance(options[0].artParams, generatedParams).toFixed(3)),
              variationSummary: summarizeVariation(options[0].artParams, generatedParams),
            }
          : {
              optionDistance: 0,
              variationSummary: 'baseline option',
            },
      });
    }

    return NextResponse.json({
      keyword: trimmedKeyword,
      mood: moodResult.mood,
      artParams: options[0].artParams,
      options,
      debug: {
        confidence: moodResult.confidence ?? null,
        semanticProfile: moodResult.semanticProfile ?? null,
        pipelinePath: moodResult.semanticProfile?.pipelinePath ?? 'direct-semantic',
      },
    });
  } catch (error: unknown) {
    console.error('Error generating art:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to generate art') },
      { status: 500 }
    );
  }
}
