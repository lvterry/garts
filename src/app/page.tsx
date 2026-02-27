'use client';

import { type FormEvent, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  Hash,
  Layers3,
  Palette,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArtParams } from '@/components/SvgArtCanvas';

const SvgArtCanvas = dynamic(() => import('@/components/SvgArtCanvas'), {
  ssr: false,
  loading: () => (
    <div className="aspect-square bg-secondary rounded-xl flex items-center justify-center">
      Loading...
    </div>
  ),
});

interface PreviewData {
  keyword: string;
  mood: string;
  artParams: ArtParams;
  options?: PreviewOption[];
  debug?: {
    confidence?: number | null;
    semanticProfile?: Record<string, unknown> | null;
    pipelinePath?: 'direct-semantic' | 'expand-then-extract';
    rawModelJson?: Record<string, unknown> | null;
  };
}

interface PreviewOption {
  optionId: string;
  label: string;
  artParams: ArtParams;
  meta?: {
    optionDistance?: number;
    variationSummary?: string;
  };
}

interface ArtworkData {
  id: string;
  keyword: string;
  mood: string;
  artData: ArtParams;
  createdAt: string;
}

type StageStatus = 'pending' | 'active' | 'done';

const GENERATION_STEPS = [
  {
    label: 'Analyze mood',
    description: 'Interpreting your keyword and mapping mood signal.',
  },
  {
    label: 'Build parameters',
    description: 'Deriving deterministic artwork controls.',
  },
  {
    label: 'Render preview',
    description: 'Drawing shapes and colors from generated params.',
  },
] as const;

async function generateArt(keyword: string): Promise<PreviewData> {
  const response = await fetch('/api/art/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword, optionCount: 2 }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate art');
  }

  return response.json();
}

async function saveArt(data: { keyword: string; mood: string; artParams: ArtParams }) {
  const response = await fetch('/api/art/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keyword: data.keyword,
      mood: data.mood,
      artData: data.artParams,
      format: 'svg',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to save art');
  }

  return response.json();
}

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

function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function getStepStatus(
  index: number,
  currentStep: number,
  loading: boolean,
  hasPreview: boolean
): StageStatus {
  if (hasPreview && !loading) {
    return 'done';
  }

  if (index === currentStep) {
    return 'active';
  }

  if (index < currentStep) {
    return 'done';
  }

  return 'pending';
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
        const response = await fetch('/api/art?limit=6');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
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
      const art = await generateArt(keyword.trim());
      setPreview(art);
      const options = getPreviewOptions(art);
      setSelectedOptionId(options[0]?.optionId ?? null);
      setKeyword('');
    } catch {
      setError('Failed to generate art. Please try again.');
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
      const response = await fetch('/api/art?limit=6');
      const data = await response.json();
      setArtworks(data.artworks);
    } catch {
      setError('Failed to save art. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this artwork?')) return;

    try {
      await fetch(`/api/art/${id}`, { method: 'DELETE' });
      setArtworks(artworks.filter((a) => a.id !== id));
    } catch {
      alert('Failed to delete artwork');
    }
  };

  const options = getPreviewOptions(preview);
  const activeOption = options.find((option) => option.optionId === selectedOptionId) ?? options[0] ?? null;

  return (
    <div>
      <section className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-4xl font-semibold tracking-tight mb-3 text-foreground">
          Generative Art from Your Mood
        </h1>
        <p className="text-gray-400">
          Enter a keyword and inspect how AI parameters shape your artwork
        </p>
      </section>

      <section className="flex justify-center mb-12">
        <form onSubmit={handleGenerate} className="flex gap-2 w-full max-w-md">
          <Input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter a keyword..."
            disabled={loading}
            className="h-10"
          />
          <Button type="submit" disabled={loading || !keyword.trim()}>
            {loading ? 'Generating...' : 'Generate'}
          </Button>
        </form>
      </section>

      {error && <p className="text-center text-destructive mb-6">{error}</p>}

      {(loading || preview) && (
        <section className="max-w-6xl mx-auto mb-12">
          <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
            <Card className="border-primary/30 shadow-sm">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <p className="text-sm text-muted-foreground">Compare Options</p>
                    <p className="text-sm">
                      {preview ? (
                        <>
                          <span className="font-semibold text-foreground">{preview.keyword}</span>
                          {' -> '}
                          <span className="capitalize text-muted-foreground">{preview.mood}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Generating a new artwork...</span>
                      )}
                    </p>
                    {activeOption && (
                      <p className="text-xs text-muted-foreground mt-1">Selected: {activeOption.label}</p>
                    )}
                  </div>
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>

                {loading ? (
                  <div className="grid gap-3 sm:grid-cols-2 animate-pulse">
                    <div className="aspect-square bg-secondary rounded-xl w-full" />
                    <div className="aspect-square bg-secondary rounded-xl w-full" />
                  </div>
                ) : (
                  preview && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {options.map((option) => {
                        const isSelected = option.optionId === selectedOptionId;

                        return (
                          <button
                            key={option.optionId}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => setSelectedOptionId(option.optionId)}
                            className={`text-left rounded-xl border overflow-hidden transition-all ${
                              isSelected
                                ? 'border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.18)]'
                                : 'border-border hover:border-primary/40'
                            }`}
                          >
                            <div className="aspect-square w-full">
                              <SvgArtCanvas params={option.artParams} />
                            </div>
                            <div className="px-3 py-2 border-t bg-card/80 flex items-center justify-between">
                              <span className="text-xs font-medium">{option.label}</span>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )
                )}

                <div className="text-center mt-6">
                  {savedId ? (
                    <Button asChild>
                      <Link href={`/art/${savedId}`}>View in Gallery</Link>
                    </Button>
                  ) : (
                    <Button onClick={handleSave} disabled={saving || loading || !activeOption}>
                      {saving ? 'Saving...' : 'Save to Gallery'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-5 md:p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold tracking-tight">Generation Inspector</h3>
                  <Activity className="w-5 h-5 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                  {GENERATION_STEPS.map((step, index) => {
                    const status = getStepStatus(index, stepIndex, loading, Boolean(preview));
                    const dotClass =
                      status === 'done'
                        ? 'bg-primary'
                        : status === 'active'
                          ? 'bg-primary/70 animate-pulse'
                          : 'bg-muted';

                    return (
                      <div key={step.label} className="flex items-start gap-3">
                        <span className={`mt-1 w-2.5 h-2.5 rounded-full ${dotClass}`} />
                        <div>
                          <p className="text-sm font-medium">{step.label}</p>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-lg border bg-card/50 p-3 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5" />
                    Input & Identity
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="text-muted-foreground">Keyword</p>
                    <p className="text-right truncate">{preview?.keyword ?? '-'}</p>
                    <p className="text-muted-foreground">Mood</p>
                    <p className="text-right capitalize">{preview?.mood ?? '-'}</p>
                    <p className="text-muted-foreground">Option</p>
                    <p className="text-right">{activeOption?.label ?? '-'}</p>
                    <p className="text-muted-foreground">Seed</p>
                    <p className="text-right">{activeOption?.artParams.seed ?? '-'}</p>
                    <p className="text-muted-foreground">Layout</p>
                    <p className="text-right text-xs leading-5">{activeOption?.artParams.layoutAlgorithm ?? '-'}</p>
                    <p className="text-muted-foreground">Shape Style</p>
                    <p className="text-right text-xs leading-5">{activeOption?.artParams.shapeStyle ?? '-'}</p>
                    <p className="text-muted-foreground">Legacy Algorithm</p>
                    <p className="text-right text-xs leading-5">{activeOption?.artParams.renderAlgorithm ?? 'legacy-shapes'}</p>
                    <p className="text-muted-foreground">Palette</p>
                    <p className="text-right text-xs leading-5">{activeOption?.artParams.paletteId ?? '-'}</p>
                    <p className="text-muted-foreground">Variation</p>
                    <p className="text-right text-xs leading-5">{activeOption?.meta?.variationSummary ?? '-'}</p>
                  </div>
                </div>

                <div className="rounded-lg border bg-card/50 p-3 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <Layers3 className="w-3.5 h-3.5" />
                    Composition
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="text-muted-foreground">Shape Types</p>
                    <p className="text-right">{activeOption?.artParams.shapeTypes.join(', ') ?? '-'}</p>
                    <p className="text-muted-foreground">Complexity</p>
                    <p className="text-right">{activeOption ? formatValue(activeOption.artParams.complexity) : '-'}</p>
                    <p className="text-muted-foreground">Layers</p>
                    <p className="text-right">{activeOption?.artParams.layerCount ?? '-'}</p>
                    <p className="text-muted-foreground">Position Bias</p>
                    <p className="text-right capitalize">{activeOption?.artParams.positionBias ?? '-'}</p>
                  </div>
                </div>

                <div className="rounded-lg border bg-card/50 p-3 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Dynamics
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="text-muted-foreground">Motion Speed</p>
                    <p className="text-right">{activeOption ? formatValue(activeOption.artParams.motionSpeed) : '-'}</p>
                    <p className="text-muted-foreground">Chaos Level</p>
                    <p className="text-right">{activeOption ? formatValue(activeOption.artParams.chaosLevel) : '-'}</p>
                    <p className="text-muted-foreground">Rotation Var.</p>
                    <p className="text-right">{activeOption ? formatValue(activeOption.artParams.rotationVariance) : '-'}</p>
                    <p className="text-muted-foreground">Size Curve</p>
                    <p className="text-right">{activeOption ? formatValue(activeOption.artParams.sizeCurve) : '-'}</p>
                    <p className="text-muted-foreground">Noise Field</p>
                    <p className="text-right text-xs leading-5">
                      {activeOption?.artParams.noisePlacement
                        ? `s:${activeOption.artParams.noisePlacement.scale} st:${activeOption.artParams.noisePlacement.strength}`
                        : '-'}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border bg-card/50 p-3 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5" />
                    Styling
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                    <p className="text-muted-foreground">Stroke Width</p>
                    <p className="text-right">{activeOption?.artParams.strokeWidth ?? '-'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Shape Colors</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeOption?.artParams.colors ?? []).map((color) => (
                        <span
                          key={color}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded border"
                        >
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          {color}
                        </span>
                      ))}
                      {!activeOption && <span className="text-xs text-muted-foreground">-</span>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Background Colors</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(activeOption?.artParams.backgroundColors ?? []).map((color) => (
                        <span
                          key={color}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded border"
                        >
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          {color}
                        </span>
                      ))}
                      {!activeOption && <span className="text-xs text-muted-foreground">-</span>}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-card/50 p-3 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Raw JSON</p>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-md border bg-muted/30 p-2 text-xs leading-5 text-foreground">
                    {preview?.debug?.rawModelJson
                      ? JSON.stringify(preview.debug.rawModelJson, null, 2)
                      : '-'}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">Recent Artworks</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/gallery">View All</Link>
          </Button>
        </div>

        {galleryLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : artworks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No artworks yet. Generate your first art above!
          </div>
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
                    handleDelete(artwork.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
