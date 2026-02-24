import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, mood, artData, format } = body;

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    if (!mood || typeof mood !== 'string') {
      return NextResponse.json(
        { error: 'Mood is required' },
        { status: 400 }
      );
    }

    if (!artData) {
      return NextResponse.json(
        { error: 'Art data is required' },
        { status: 400 }
      );
    }

    const validFormat = format === 'svg' ? 'svg' : 'p5';

    const artwork = await prisma.artwork.create({
      data: {
        keyword,
        mood,
        artData: JSON.stringify(artData),
        format: validFormat,
      },
    });

    return NextResponse.json({
      id: artwork.id,
      keyword: artwork.keyword,
      mood: artwork.mood,
      format: artwork.format,
      artData: JSON.parse(artwork.artData),
      createdAt: artwork.createdAt.toISOString(),
    });
  } catch (error: unknown) {
    console.error('Error saving art:', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to save art') },
      { status: 500 }
    );
  }
}
