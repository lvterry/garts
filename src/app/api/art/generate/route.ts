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
    const { keyword } = body;

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

    const artParams = generateArtParams(
      moodResult.mood,
      trimmedKeyword,
      moodResult.semanticProfile
    );

    return NextResponse.json({
      keyword: trimmedKeyword,
      mood: moodResult.mood,
      artParams,
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
