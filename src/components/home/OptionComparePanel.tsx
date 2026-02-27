import dynamic from 'next/dynamic';
import Link from 'next/link';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { PreviewData, PreviewOption } from '@/lib/api/types';

const SvgArtCanvas = dynamic(() => import('@/components/SvgArtCanvas'), {
  ssr: false,
  loading: () => (
    <div className="aspect-square bg-secondary rounded-xl flex items-center justify-center">
      Loading...
    </div>
  ),
});

interface OptionComparePanelProps {
  loading: boolean;
  preview: PreviewData | null;
  options: PreviewOption[];
  selectedOptionId: string | null;
  saving: boolean;
  savedId: string | null;
  onSelectOption: (optionId: string) => void;
  onSave: () => void;
}

export function OptionComparePanel({
  loading,
  preview,
  options,
  selectedOptionId,
  saving,
  savedId,
  onSelectOption,
  onSave,
}: OptionComparePanelProps) {
  const activeOption = options.find((option) => option.optionId === selectedOptionId) ?? options[0] ?? null;

  return (
    <Card className="border-border/60">
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
            {activeOption && <p className="text-xs text-muted-foreground mt-1">Selected: {activeOption.label}</p>}
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
                    onClick={() => onSelectOption(option.optionId)}
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
            <Button onClick={onSave} disabled={saving || loading || !activeOption}>
              {saving ? 'Saving...' : 'Save to Gallery'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
