import { NextRequest, NextResponse } from 'next/server';
import { createMoodAnalyzer } from '@/lib/ai';
import { generateArtParams, ArtAlgorithm } from '@/lib/art-generator';

export const dynamic = 'force-dynamic';

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

    const mixed = generateArtParams(moodResult.mood, trimmedKeyword, 'mixed');
    const single = generateArtParams(moodResult.mood, trimmedKeyword, 'single');

    return NextResponse.json({
      keyword: trimmedKeyword,
      mood: moodResult.mood,
      mixed,
      single,
    });
  } catch (error: any) {
    console.error('Error generating art:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate art' },
      { status: 500 }
    );
  }
}
