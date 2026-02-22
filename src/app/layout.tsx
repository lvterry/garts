import type { Metadata } from 'next';
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
      <body>
        <header className="header">
          <nav className="nav">
            <a href="/" className="logo">
              Garts
            </a>
            <div className="nav-links">
              <a href="/">Generate</a>
              <a href="/gallery">Gallery</a>
            </div>
          </nav>
        </header>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
