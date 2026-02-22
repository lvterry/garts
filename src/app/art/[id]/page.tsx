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
    return <div className="loading">Loading...</div>;
  }

  if (error || !artwork) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <p className="error" style={{ marginBottom: 16 }}>{error || 'Artwork not found'}</p>
        <Link href="/gallery" className="btn btn-secondary">
          Back to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Link href="/gallery" className="detail-back">
        ← Back to Gallery
      </Link>

      <div className="detail-content">
        <div className="detail-artwork">
          <ArtCanvas params={artwork.artData} width={500} height={500} />
        </div>

        <div className="detail-info">
          <div className="info-item">
            <p className="info-label">Keyword</p>
            <p className="info-value">{artwork.keyword}</p>
          </div>
          <div className="info-item">
            <p className="info-label">Mood</p>
            <p className="info-value mood">{artwork.mood}</p>
          </div>
          <div className="info-item">
            <p className="info-label">Created</p>
            <p className="info-value">{new Date(artwork.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="info-item">
            <p className="info-label">Style</p>
            <p className="info-value">{artwork.artData.shapeType}</p>
          </div>

          <div className="detail-actions">
            <button onClick={handleDelete} disabled={deleting} className="btn btn-danger">
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
