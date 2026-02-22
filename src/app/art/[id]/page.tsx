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
    return (
      <div className="loading-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="error-container">
        <div className="error">{error || 'Artwork not found'}</div>
        <Link href="/gallery" className="back-link">
          Back to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="art-detail">
      <Link href="/gallery" className="back-link">
        ← Back to Gallery
      </Link>

      <div className="art-container">
        <ArtCanvas params={artwork.artData} width={600} height={600} />
      </div>

      <div className="art-info">
        <div className="info-row">
          <span className="label">Keyword</span>
          <span className="value">{artwork.keyword}</span>
        </div>
        <div className="info-row">
          <span className="label">Mood</span>
          <span className="value mood">{artwork.mood}</span>
        </div>
        <div className="info-row">
          <span className="label">Created</span>
          <span className="value">
            {new Date(artwork.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div className="info-row">
          <span className="label">Style</span>
          <span className="value">{artwork.artData.shapeType}</span>
        </div>
      </div>

      <div className="actions">
        <button onClick={handleDelete} disabled={deleting} className="delete-btn">
          {deleting ? 'Deleting...' : 'Delete Artwork'}
        </button>
      </div>

      <style jsx>{`
        .art-detail {
          max-width: 800px;
          margin: 0 auto;
        }
        .back-link {
          display: inline-block;
          color: #667eea;
          text-decoration: none;
          margin-bottom: 24px;
          font-weight: 500;
        }
        .back-link:hover {
          text-decoration: underline;
        }
        .art-container {
          display: flex;
          justify-content: center;
          margin-bottom: 32px;
        }
        .art-info {
          background: #2a2a4a;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #3a3a5c;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .label {
          color: #aaaaaa;
        }
        .value {
          font-weight: 500;
          text-transform: capitalize;
        }
        .value.mood {
          color: #667eea;
        }
        .actions {
          display: flex;
          justify-content: center;
        }
        .delete-btn {
          padding: 12px 24px;
          background: #ff6b6b;
          border: none;
          border-radius: 8px;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .delete-btn:hover:not(:disabled) {
          opacity: 0.8;
        }
        .delete-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .loading-container,
        .error-container {
          text-align: center;
          padding: 48px;
        }
        .loading {
          color: #666;
        }
        .error {
          color: #ff6b6b;
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}
