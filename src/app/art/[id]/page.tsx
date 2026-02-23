'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArtParams } from '@/components/ArtCanvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const ArtCanvas = dynamic(() => import('@/components/ArtCanvas'), {
  ssr: false,
});

interface ArtworkData {
  id: string;
  keyword: string;
  mood: string;
  artData: ArtParams;
  createdAt: string;
}

export default function ArtDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [artwork, setArtwork] = useState<ArtworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const id = params.id as string;

  useEffect(() => {
    async function fetchArtwork() {
      try {
        const response = await fetch(`/api/art/${id}`);
        if (!response.ok) throw new Error('Not found');
        const data = await response.json();
        setArtwork(data);
      } catch (err) {
        setError('Artwork not found');
      } finally {
        setLoading(false);
      }
    }
    fetchArtwork();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this artwork?')) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/art/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      router.push('/gallery');
    } catch (err) {
      alert('Failed to delete artwork');
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  if (error || !artwork) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error || 'Artwork not found'}</p>
        <Button variant="ghost" asChild>
          <Link href="/gallery">Back to Gallery</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/gallery">
          ← Back to Gallery
        </Link>
      </Button>

      <div className="grid md:grid-cols-[1fr_280px] gap-12">
        <div className="aspect-square bg-secondary rounded-xl overflow-hidden">
          <ArtCanvas params={artwork.artData} width={500} height={500} />
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="pb-4 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Keyword</p>
              <p className="font-medium">{artwork.keyword}</p>
            </div>
            <div className="pb-4 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Mood</p>
              <p className="font-medium capitalize text-muted-foreground">{artwork.mood}</p>
            </div>
            <div className="pb-4 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Created</p>
              <p className="font-medium text-muted-foreground">{new Date(artwork.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Style</p>
              <p className="font-medium text-muted-foreground capitalize">{artwork.artData.shapeType}</p>
            </div>

            <Button
              onClick={handleDelete}
              disabled={deleting}
              variant="destructive"
              className="w-full mt-6"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
