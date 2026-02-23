'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArtParams } from '@/components/ArtCanvas';
import { Card, CardContent } from '@/components/ui/card';

const ArtCanvas = dynamic(() => import('@/components/ArtCanvas'), {
  ssr: false,
  loading: () => <div className="aspect-square bg-secondary" />,
});

interface ArtworkData {
  id: string;
  keyword: string;
  mood: string;
  artData: ArtParams;
  createdAt: string;
}

export default function GalleryPage() {
  const [artworks, setArtworks] = useState<ArtworkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchArtworks() {
      try {
        const response = await fetch('/api/art');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setArtworks(data.artworks);
      } catch (err) {
        setError('Failed to load artworks');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchArtworks();
  }, []);

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Gallery</h1>
        <p className="text-muted-foreground">Browse all generated artworks</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">{error}</div>
      ) : artworks.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No artworks yet. Generate your first art above!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {artworks.map((artwork) => (
            <Link href={`/art/${artwork.id}`} key={artwork.id} className="block">
              <Card className="overflow-hidden hover:-translate-y-1 transition-transform">
                <CardContent className="p-0">
                  <div className="aspect-square bg-secondary">
                    <ArtCanvas params={artwork.artData} width={400} height={400} />
                  </div>
                  <div className="px-4 py-3 flex justify-between items-center">
                    <span className="font-medium">{artwork.keyword}</span>
                    <span className="text-sm text-muted-foreground capitalize">{artwork.mood}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
