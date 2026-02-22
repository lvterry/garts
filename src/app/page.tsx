'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import KeywordInput from '@/components/KeywordInput';
import { ArtParams } from '@/components/ArtCanvas';

const ArtCanvas = dynamic(() => import('@/components/ArtCanvas'), {
  ssr: false,
});

interface GenerateResult {
  id: string;
  keyword: string;
  mood: string;
  artData: ArtParams;
}

async function generateArt(keyword: string): Promise<GenerateResult> {
  const response = await fetch('/api/art/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate art');
  }

  return response.json();
}

export default function Home() {
  const [generatedArt, setGeneratedArt] = useState<GenerateResult | null>(null);

  return (
    <div className="home">
      <section className="hero">
        <h1 className="title">Generative Art from Your Mood</h1>
        <p className="subtitle">
          Enter a keyword and let AI extract the mood to generate unique art
        </p>
      </section>

      <section className="generate-section">
        <KeywordInput onGenerate={generateArt} />
      </section>

      {generatedArt && (
        <section className="preview-section">
          <h2>Your Generated Art</h2>
          <div className="preview-container">
            <ArtCanvas params={generatedArt.artData} width={500} height={500} />
          </div>
          <div className="preview-actions">
            <a href="/gallery" className="view-gallery-btn">
              View in Gallery
            </a>
          </div>
        </section>
      )}

      <style jsx>{`
        .home {
          display: flex;
          flex-direction: column;
          gap: 48px;
        }
        .hero {
          text-align: center;
        }
        .title {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 16px;
          background: linear-gradient(135deg, #667eea, #f093fb);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .subtitle {
          font-size: 18px;
          color: #aaaaaa;
          max-width: 500px;
          margin: 0 auto;
        }
        .generate-section {
          display: flex;
          justify-content: center;
        }
        .preview-section {
          text-align: center;
        }
        .preview-section h2 {
          font-size: 24px;
          margin-bottom: 24px;
        }
        .preview-container {
          display: flex;
          justify-content: center;
        }
        .preview-actions {
          margin-top: 24px;
        }
        .view-gallery-btn {
          display: inline-block;
          padding: 12px 24px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: transform 0.2s;
        }
        .view-gallery-btn:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
