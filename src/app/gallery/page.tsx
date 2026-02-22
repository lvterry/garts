'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArtParams } from '@/components/ArtCanvas';

const ArtCanvas = dynamic(() => import('@/components/ArtCanvas'), {
  ssr: false,
  loading: () => <div style={{ aspectRatio: 1, background: 'var(--bg-tertiary)' }} />,
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
      <div className="page-header">
        <h1 className="page-title">Gallery</h1>
        <p className="page-subtitle">Browse all generated artworks</p>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : artworks.length === 0 ? (
        <div className="empty-state">
          <p>No artworks yet. Generate your first art above!</p>
        </div>
      ) : (
        <div className="grid">
          {artworks.map((artwork) => (
            <Link href={`/art/${artwork.id}`} key={artwork.id} className="card">
              <div className="card-image">
                <ArtCanvas params={artwork.artData} width={400} height={400} />
              </div>
              <div className="card-content">
                <span className="card-title">{artwork.keyword}</span>
                <span className="card-meta">{artwork.mood}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
