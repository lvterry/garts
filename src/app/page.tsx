'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ArtParams } from '@/components/ArtCanvas';

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
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter a keyword..."
            className="flex-1 px-4 py-3.5 text-base bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !keyword.trim()}
            className="px-6 py-3.5 text-sm font-medium bg-white text-black rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </form>
      </section>

      {error && (
        <p className="text-center text-red-400 mb-8">{error}</p>
      )}

      {generatedArt && (
        <section className="text-center">
          <div className="flex justify-center mb-6">
            <ArtCanvas params={generatedArt.artData} width={500} height={500} />
          </div>
          <p className="mb-6 text-gray-400">
            <span className="font-semibold text-white">{generatedArt.keyword}</span>
            {' → '}
            <span className="capitalize">{generatedArt.mood}</span>
          </p>
          <a
            href="/gallery"
            className="inline-block px-6 py-3 text-sm font-medium bg-zinc-900 text-white border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            View in Gallery
          </a>
        </section>
      )}
    </div>
  );
}
