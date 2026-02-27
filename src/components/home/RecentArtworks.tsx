import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { ArtworkData } from '@/lib/api/types';

const SvgArtCanvas = dynamic(() => import('@/components/SvgArtCanvas'), {
  ssr: false,
  loading: () => <div className="aspect-square bg-secondary" />,
});

interface RecentArtworksProps {
  artworks: ArtworkData[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export function RecentArtworks({ artworks, loading, onDelete }: RecentArtworksProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Recent Artworks</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/gallery">View All</Link>
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : artworks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No artworks yet. Generate your first art above!</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {artworks.map((artwork) => (
            <div key={artwork.id} className="relative group">
              <Link href={`/art/${artwork.id}`} className="block">
                <Card className="overflow-hidden hover:-translate-y-1 transition-transform">
                  <CardContent className="p-0">
                    <div className="aspect-square bg-secondary">
                      <SvgArtCanvas params={artwork.artData} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(artwork.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
