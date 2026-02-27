'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import type { ArtworkData } from '@/lib/api/types';
import { deleteArtwork, listArtworks } from '@/lib/api/art-client';

const SvgArtCanvas = dynamic(() => import('@/components/SvgArtCanvas'), {
  ssr: false,
  loading: () => <div className="aspect-square bg-secondary" />,
});

export default function GalleryPage() {
  const [artworks, setArtworks] = useState<ArtworkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArtworks() {
      try {
        const data = await listArtworks();
        setArtworks(data.artworks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load artworks');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchArtworks();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this artwork?')) return;

    setDeletingId(id);
    try {
      await deleteArtwork(id);
      setArtworks((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert('Failed to delete artwork');
    } finally {
      setDeletingId(null);
    }
  };

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
        <div className="text-center py-20 text-muted-foreground">No artworks yet. Generate your first art above!</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {artworks.map((artwork) => (
            <div key={artwork.id} className="relative group">
              <Link href={`/art/${artwork.id}`} className="block">
                <Card className="overflow-hidden hover:-translate-y-1 transition-transform">
                  <CardContent className="p-0">
                    <div className="aspect-square bg-secondary">
                      <SvgArtCanvas params={artwork.artData} />
                    </div>
                    <div className="px-4 py-3 flex justify-between items-center">
                      <span className="font-medium">{artwork.keyword}</span>
                      <span className="text-sm text-muted-foreground capitalize">{artwork.mood}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(artwork.id);
                }}
                disabled={deletingId === artwork.id}
              >
                {deletingId === artwork.id ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
