'use client';

import { type FormEvent, useEffect, useState } from 'react';
import type { PreviewData, PreviewOption, ArtworkData } from '@/lib/api/types';
import { deleteArtwork, generateArt, listArtworks, saveArt } from '@/lib/api/art-client';
import { GenerateForm } from '@/components/home/GenerateForm';
import { GenerationInspector } from '@/components/home/GenerationInspector';
import { OptionComparePanel } from '@/components/home/OptionComparePanel';
import { RecentArtworks } from '@/components/home/RecentArtworks';

function getPreviewOptions(preview: PreviewData | null): PreviewOption[] {
  if (!preview) {
    return [];
  }

  if (Array.isArray(preview.options) && preview.options.length > 0) {
    return preview.options;
  }

  return [
    {
      optionId: `${preview.artParams.seed}-0`,
      label: 'Option A',
      artParams: preview.artParams,
    },
  ];
}

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [artworks, setArtworks] = useState<ArtworkData[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    async function fetchArtworks() {
      try {
        const data = await listArtworks({ limit: 6 });
        setArtworks(data.artworks);
      } catch (err) {
        console.error(err);
      } finally {
        setGalleryLoading(false);
      }
    }

    fetchArtworks();
  }, []);

  useEffect(() => {
    if (!loading) return;

    setStepIndex(0);
    const firstTimer = window.setTimeout(() => setStepIndex(1), 380);
    const secondTimer = window.setTimeout(() => setStepIndex(2), 780);

    return () => {
      window.clearTimeout(firstTimer);
      window.clearTimeout(secondTimer);
    };
  }, [loading]);

  const handleGenerate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError('');
    setPreview(null);
    setSelectedOptionId(null);
    setSavedId(null);

    try {
      const art = await generateArt(keyword.trim(), 2);
      setPreview(art);
      const options = getPreviewOptions(art);
      setSelectedOptionId(options[0]?.optionId ?? null);
      setKeyword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate art. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;

    const options = getPreviewOptions(preview);
    const activeOption = options.find((option) => option.optionId === selectedOptionId) ?? options[0];
    if (!activeOption) return;

    setSaving(true);
    try {
      const result = await saveArt({
        keyword: preview.keyword,
        mood: preview.mood,
        artParams: activeOption.artParams,
      });
      setSavedId(result.id);
      const data = await listArtworks({ limit: 6 });
      setArtworks(data.artworks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save art. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this artwork?')) return;

    try {
      await deleteArtwork(id);
      setArtworks((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert('Failed to delete artwork');
    }
  };

  const options = getPreviewOptions(preview);
  const activeOption = options.find((option) => option.optionId === selectedOptionId) ?? options[0] ?? null;

  return (
    <div>
      <section className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-4xl font-semibold tracking-tight mb-3 text-foreground">Generative Art from Your Mood</h1>
        <p className="text-gray-400">Enter a keyword and inspect how AI parameters shape your artwork</p>
      </section>

      <GenerateForm
        keyword={keyword}
        loading={loading}
        onKeywordChange={setKeyword}
        onSubmit={handleGenerate}
      />

      {error && <p className="text-center text-destructive mb-6">{error}</p>}

      {(loading || preview) && (
        <section className="max-w-6xl mx-auto mb-12">
          <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
            <OptionComparePanel
              loading={loading}
              preview={preview}
              options={options}
              selectedOptionId={selectedOptionId}
              saving={saving}
              savedId={savedId}
              onSelectOption={setSelectedOptionId}
              onSave={handleSave}
            />
            <GenerationInspector
              loading={loading}
              stepIndex={stepIndex}
              preview={preview}
              activeOption={activeOption}
            />
          </div>
        </section>
      )}

      <RecentArtworks artworks={artworks} loading={galleryLoading} onDelete={handleDelete} />
    </div>
  );
}
