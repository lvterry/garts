import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createMoodAnalyzer } from '@/lib/ai';
import { generateArtParams, artParamsToJSON } from '@/lib/art-generator';

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

    const artParams = generateArtParams(moodResult.mood);
    const artData = artParamsToJSON(artParams);

    const artwork = await prisma.artwork.create({
      data: {
        keyword: trimmedKeyword,
        mood: moodResult.mood,
        artData,
      },
    });

    return NextResponse.json({
      id: artwork.id,
      keyword: artwork.keyword,
      mood: artwork.mood,
      artData: JSON.parse(artwork.artData),
      createdAt: artwork.createdAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating art:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate art' },
      { status: 500 }
    );
  }
}
