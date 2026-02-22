'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArtParams } from './ArtCanvas';

const ArtCanvas = dynamic(() => import('./ArtCanvas'), {
  ssr: false,
  loading: () => <div style={{ aspectRatio: 1, background: 'var(--bg-tertiary)' }} />,
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
      <div className="empty-state">
        <p>No artworks yet. Generate your first art above!</p>
      </div>
    );
  }

  return (
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
  );
}
