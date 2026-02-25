import { NextRequest, NextResponse } from 'next/server';
import { createMoodAnalyzer } from '@/lib/ai';
import { generateArtParams } from '@/lib/art-generator';

export const dynamic = 'force-dynamic';

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

    const options = Array.from({ length: safeOptionCount }, (_, index) => {
      const generatedParams = generateArtParams(
        moodResult.mood,
        trimmedKeyword,
        moodResult.semanticProfile
      );

      return {
        optionId: `${generatedParams.seed}-${index}`,
        label: `Option ${String.fromCharCode(65 + index)}`,
        artParams: generatedParams,
      };
    });

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
