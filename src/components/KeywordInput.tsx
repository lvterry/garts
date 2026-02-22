'use client';

import { useState } from 'react';
import { ArtParams } from './ArtCanvas';

interface KeywordInputProps {
  onGenerate: (keyword: string) => Promise<{
    id: string;
    keyword: string;
    mood: string;
    artData: ArtParams;
  }>;
}

export default function KeywordInput({ onGenerate }: KeywordInputProps) {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    id: string;
    keyword: string;
    mood: string;
    artData: ArtParams;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const art = await onGenerate(keyword.trim());
      setResult(art);
      setKeyword('');
    } catch (err) {
      setError('Failed to generate art. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="keyword-input-container">
      <form onSubmit={handleSubmit} className="keyword-form">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Enter a keyword (e.g., 'sunset', 'peace', 'adventure')"
          disabled={loading}
          className="keyword-input"
        />
        <button type="submit" disabled={loading || !keyword.trim()} className="generate-btn">
          {loading ? 'Generating...' : 'Generate Art'}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {result && (
        <div className="result-info">
          <p>
            Keyword: <strong>{result.keyword}</strong> → Mood: <strong>{result.mood}</strong>
          </p>
        </div>
      )}

      <style jsx>{`
        .keyword-input-container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }
        .keyword-form {
          display: flex;
          gap: 12px;
        }
        .keyword-input {
          flex: 1;
          padding: 14px 18px;
          font-size: 16px;
          border: 2px solid #3a3a5c;
          border-radius: 8px;
          background: #1a1a2e;
          color: #fff;
          outline: none;
          transition: border-color 0.2s;
        }
        .keyword-input:focus {
          border-color: #667eea;
        }
        .keyword-input::placeholder {
          color: #666;
        }
        .generate-btn {
          padding: 14px 28px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: #fff;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }
        .generate-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        .generate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .error-message {
          color: #ff6b6b;
          margin-top: 12px;
          text-align: center;
        }
        .result-info {
          margin-top: 16px;
          padding: 12px;
          background: #2a2a4a;
          border-radius: 8px;
          text-align: center;
          color: #aaa;
        }
        .result-info strong {
          color: #fff;
        }
      `}</style>
    </div>
  );
}
