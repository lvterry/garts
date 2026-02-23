'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
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

interface ArtworkData {
  id: string;
  keyword: string;
  mood: string;
  artData: ArtParams;
  createdAt: string;
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
  const [artworks, setArtworks] = useState<ArtworkData[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);

  useEffect(() => {
    async function fetchArtworks() {
      try {
        const response = await fetch('/api/art?limit=6');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setArtworks(data.artworks);
      } catch (err) {
        console.error(err);
      } finally {
        setGalleryLoading(false);
      }
    }
    fetchArtworks();
  }, []);

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
      const response = await fetch('/api/art?limit=6');
      const data = await response.json();
      setArtworks(data.artworks);
    } catch (err) {
      setError('Failed to save art. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this artwork?')) return;

    try {
      await fetch(`/api/art/${id}`, { method: 'DELETE' });
      setArtworks(artworks.filter((a) => a.id !== id));
    } catch (err) {
      alert('Failed to delete artwork');
    }
  };

  return (
    <div>
      <section className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">
          Generative Art from Your Mood
        </h1>
        <p className="text-gray-400">
          Enter a keyword and let AI extract the mood to generate unique art
        </p>
      </section>

      <section className="flex justify-center mb-12">
        <form onSubmit={handleGenerate} className="flex gap-2 w-full max-w-sm">
          <Input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter a keyword..."
            disabled={loading}
            className="h-9"
          />
          <Button type="submit" disabled={loading || !keyword.trim()} size="sm">
            {loading ? '...' : 'Generate'}
          </Button>
        </form>
      </section>

      {error && (
        <p className="text-center text-destructive mb-6">{error}</p>
      )}

      {preview && (
        <section className="max-w-4xl mx-auto mb-12">
          <div className="text-center mb-4">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{preview.keyword}</span>
              {' → '}
              <span className="capitalize">{preview.mood}</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
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
                  width={320} 
                  height={320} 
                />
              </div>
              <div className="p-2 text-center bg-secondary/50 text-sm">
                <span className="font-medium">Variant A</span>
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
                  width={320} 
                  height={320} 
                />
              </div>
              <div className="p-2 text-center bg-secondary/50 text-sm">
                <span className="font-medium">Variant B</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            {savedId ? (
              <Button asChild size="sm">
                <Link href={`/art/${savedId}`}>View in Gallery</Link>
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? 'Saving...' : 'Save to Gallery'}
              </Button>
            )}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">Recent Artworks</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/gallery">View All</Link>
          </Button>
        </div>

        {galleryLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : artworks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No artworks yet. Generate your first art above!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {artworks.map((artwork) => (
              <div key={artwork.id} className="relative group">
                <Link href={`/art/${artwork.id}`} className="block">
                  <Card className="overflow-hidden hover:-translate-y-1 transition-transform">
                    <CardContent className="p-0">
                      <div className="aspect-square bg-secondary">
                        <SvgArtCanvas params={artwork.artData} width={200} height={200} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(artwork.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
