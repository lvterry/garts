'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArtParams } from '@/components/ArtCanvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ArtCanvas = dynamic(() => import('@/components/ArtCanvas'), {
  ssr: false,
});

interface GenerateResult {
  id: string;
  keyword: string;
  mood: string;
  artData: ArtParams;
}

async function generateArt(keyword: string): Promise<GenerateResult> {
  const response = await fetch('/api/art/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate art');
  }

  return response.json();
}

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedArt, setGeneratedArt] = useState<GenerateResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError('');

    try {
      const art = await generateArt(keyword.trim());
      setGeneratedArt(art);
      setKeyword('');
    } catch (err) {
      setError('Failed to generate art. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-5xl font-semibold tracking-tight mb-5 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
          Generative Art from Your Mood
        </h1>
        <p className="text-lg text-gray-400">
          Enter a keyword and let AI extract the mood to generate unique art
        </p>
      </section>

      <section className="flex justify-center mb-16">
        <form onSubmit={handleSubmit} className="flex gap-3 w-full max-w-md">
          <Input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter a keyword..."
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !keyword.trim()}>
            {loading ? 'Generating...' : 'Generate'}
          </Button>
        </form>
      </section>

      {error && (
        <p className="text-center text-destructive mb-8">{error}</p>
      )}

      {generatedArt && (
        <section className="text-center">
          <div className="flex justify-center mb-6">
            <ArtCanvas params={generatedArt.artData} width={500} height={500} />
          </div>
          <p className="mb-6 text-muted-foreground">
            <span className="font-semibold text-foreground">{generatedArt.keyword}</span>
            {' → '}
            <span className="capitalize">{generatedArt.mood}</span>
          </p>
          <Button asChild>
            <Link href="/gallery">View in Gallery</Link>
          </Button>
        </section>
      )}
    </div>
  );
}
