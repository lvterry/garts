'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArtParams } from '@/components/SvgArtCanvas';

const SvgArtCanvas = dynamic(() => import('@/components/SvgArtCanvas'), {
  ssr: false,
  loading: () => (
    <div className="aspect-square bg-secondary rounded-xl flex items-center justify-center">
      Loading...
    </div>
  ),
});

interface PreviewData {
  keyword: string;
  mood: string;
  artData: ArtParams;
}

async function generateArt(keyword: string): Promise<PreviewData> {
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

async function saveArt(data: PreviewData & { seed: number }) {
  const response = await fetch('/api/art/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keyword: data.keyword,
      mood: data.mood,
      artData: {
        ...data.artData,
        seed: data.seed,
      },
      format: 'svg',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to save art');
  }

  return response.json();
}

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<1 | 2>(1);
  const [savedId, setSavedId] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError('');
    setPreview(null);
    setSavedId(null);

    try {
      const art = await generateArt(keyword.trim());
      setPreview(art);
      setKeyword('');
      setSelectedVariant(1);
    } catch (err) {
      setError('Failed to generate art. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;

    const selectedSeed = selectedVariant === 1 ? preview.artData.seed : preview.artData.seed + 1;

    setSaving(true);
    try {
      const result = await saveArt({ ...preview, seed: selectedSeed });
      setSavedId(result.id);
    } catch (err) {
      setError('Failed to save art. Please try again.');
    } finally {
      setSaving(false);
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
        <form onSubmit={handleGenerate} className="flex gap-3 w-full max-w-md">
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

      {preview && (
        <section className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{preview.keyword}</span>
              {' → '}
              <span className="capitalize">{preview.mood}</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div 
              className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                selectedVariant === 1 
                  ? 'border-primary ring-2 ring-primary/50' 
                  : 'border-transparent hover:border-muted'
              }`}
              onClick={() => setSelectedVariant(1)}
            >
              <div className="aspect-square bg-secondary rounded-xl overflow-hidden">
                <SvgArtCanvas 
                  params={{ ...preview.artData, seed: preview.artData.seed }} 
                  width={400} 
                  height={400} 
                />
              </div>
              <div className="p-3 text-center bg-secondary/50">
                <span className="font-medium">Variant A</span>
                {selectedVariant === 1 && (
                  <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                    Selected
                  </span>
                )}
              </div>
            </div>

            <div 
              className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                selectedVariant === 2 
                  ? 'border-primary ring-2 ring-primary/50' 
                  : 'border-transparent hover:border-muted'
              }`}
              onClick={() => setSelectedVariant(2)}
            >
              <div className="aspect-square bg-secondary rounded-xl overflow-hidden">
                <SvgArtCanvas 
                  params={{ ...preview.artData, seed: preview.artData.seed + 1 }} 
                  width={400} 
                  height={400} 
                />
              </div>
              <div className="p-3 text-center bg-secondary/50">
                <span className="font-medium">Variant B</span>
                {selectedVariant === 2 && (
                  <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                    Selected
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-center">
            {savedId ? (
              <Button asChild>
                <Link href={`/art/${savedId}`}>View in Gallery</Link>
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save to Gallery'}
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
