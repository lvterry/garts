'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArtParams } from '@/components/ArtCanvas';

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
    return <div className="text-center py-12 text-zinc-500">Loading...</div>;
  }

  if (error || !artwork) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error || 'Artwork not found'}</p>
        <Link href="/gallery" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
          Back to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/gallery" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
        ← Back to Gallery
      </Link>

      <div className="grid md:grid-cols-[1fr_280px] gap-12">
        <div className="aspect-square bg-zinc-900 rounded-xl overflow-hidden">
          <ArtCanvas params={artwork.artData} width={500} height={500} />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="pb-4 border-b border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Keyword</p>
            <p className="font-medium">{artwork.keyword}</p>
          </div>
          <div className="py-4 border-b border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Mood</p>
            <p className="font-medium capitalize text-gray-300">{artwork.mood}</p>
          </div>
          <div className="py-4 border-b border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Created</p>
            <p className="font-medium text-gray-300">{new Date(artwork.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="pt-4">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Style</p>
            <p className="font-medium text-gray-300 capitalize">{artwork.artData.shapeType}</p>
          </div>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full mt-6 px-4 py-2.5 text-sm font-medium text-red-400 border border-red-400/20 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
