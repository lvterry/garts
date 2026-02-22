'use client';

import { useEffect, useState } from 'react';
import GalleryGrid, { ArtworkData } from '@/components/GalleryGrid';

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
    <div className="gallery-page">
      <h1>Art Gallery</h1>
      <p className="subtitle">Browse all generated artworks</p>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <GalleryGrid artworks={artworks} />
      )}

      <style jsx>{`
        .gallery-page h1 {
          font-size: 36px;
          margin-bottom: 8px;
        }
        .subtitle {
          color: #aaaaaa;
          margin-bottom: 24px;
        }
        .loading,
        .error {
          text-align: center;
          padding: 48px;
          color: #666;
        }
        .error {
          color: #ff6b6b;
        }
      `}</style>
    </div>
  );
}
