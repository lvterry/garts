import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import './globals.css';

export const metadata: Metadata = {
  title: 'Garts - Generative Art Gallery',
  description: 'Generate unique art based on your mood keywords',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-foreground antialiased">
        <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-border z-50">
          <nav className="max-w-[1200px] mx-auto h-full px-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <div className="w-6 h-6 bg-gradient-to-br from-white to-gray-500 rounded-lg" />
              Garts
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/gallery">Gallery</Link>
              </Button>
            </div>
          </nav>
        </header>
        <main className="max-w-[1200px] mx-auto px-6 pt-32 pb-20 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
