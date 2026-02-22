'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArtParams } from './ArtCanvas';

const ArtCanvas = dynamic(() => import('./ArtCanvas'), {
  ssr: false,
  loading: () => <div className="canvas-placeholder">Loading...</div>,
});

export interface ArtworkData {
  id: string;
  keyword: string;
  mood: string;
  artData: ArtParams;
  createdAt: string;
}

interface GalleryGridProps {
  artworks: ArtworkData[];
}

export default function GalleryGrid({ artworks }: GalleryGridProps) {
  if (artworks.length === 0) {
    return (
      <div className="empty-gallery">
        <p>No artworks yet. Generate your first art above!</p>
      </div>
    );
  }

  return (
    <div className="gallery-grid">
      {artworks.map((artwork) => (
        <Link href={`/art/${artwork.id}`} key={artwork.id} className="artwork-card">
          <div className="canvas-wrapper">
            <ArtCanvas
              params={artwork.artData}
              width={280}
              height={280}
            />
          </div>
          <div className="artwork-info">
            <span className="keyword">{artwork.keyword}</span>
            <span className="mood">{artwork.mood}</span>
          </div>
        </Link>
      ))}

      <style jsx>{`
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
          padding: 24px 0;
        }
        .artwork-card {
          display: block;
          text-decoration: none;
          border-radius: 12px;
          overflow: hidden;
          background: #2a2a4a;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .artwork-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }
        .canvas-wrapper {
          width: 100%;
          aspect-ratio: 1;
        }
        .artwork-info {
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .keyword {
          color: #fff;
          font-weight: 500;
          text-transform: capitalize;
        }
        .mood {
          color: #667eea;
          font-size: 14px;
          text-transform: capitalize;
        }
        .empty-gallery {
          text-align: center;
          padding: 48px;
          color: #666;
        }
        :global(.canvas-placeholder) {
          width: 100%;
          aspect-ratio: 1;
          background: #1a1a2e;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
        }
      `}</style>
    </div>
  );
}
