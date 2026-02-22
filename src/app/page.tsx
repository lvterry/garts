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
      <section className="hero">
        <h1 className="title">Generative Art from Your Mood</h1>
        <p className="subtitle">
          Enter a keyword and let AI extract the mood to generate unique art
        </p>
      </section>

      <section className="section" style={{ display: 'flex', justifyContent: 'center' }}>
        <form onSubmit={handleSubmit} className="form-group">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter a keyword..."
            className="input"
            disabled={loading}
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={loading || !keyword.trim()} className="btn btn-primary">
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </form>
      </section>

      {error && <p className="error">{error}</p>}

      {generatedArt && (
        <section className="section">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <ArtCanvas params={generatedArt.artData} width={500} height={500} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>
              <strong>{generatedArt.keyword}</strong> → <span style={{ textTransform: 'capitalize' }}>{generatedArt.mood}</span>
            </p>
            <a href="/gallery" className="btn btn-secondary">
              View in Gallery
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
