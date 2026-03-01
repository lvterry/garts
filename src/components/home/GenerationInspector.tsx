import { Activity, Layers3 } from 'lucide-react';
import { isLegacyLayout, resolveLayoutAlgorithm } from '@/lib/art/layout';
import type { PreviewData, PreviewOption } from '@/lib/api/types';
import { Card, CardContent } from '@/components/ui/card';

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

function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function getStepStatus(index: number, currentStep: number, loading: boolean, hasPreview: boolean): StageStatus {
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

function getEffectiveGeometryLabel(layout: ReturnType<typeof resolveLayoutAlgorithm>): string {
  switch (layout) {
    case 'delaunay':
      return 'triangulation';
    case 'voronoi':
      return 'voronoi cells';
    case 'flow-field':
      return 'particle paths';
    case 'attractors':
      return 'attractor particles';
    default:
      return 'shape primitives';
  }
}

interface GenerationInspectorProps {
  loading: boolean;
  stepIndex: number;
  preview: PreviewData | null;
  activeOption: PreviewOption | null;
}

export function GenerationInspector({ loading, stepIndex, preview, activeOption }: GenerationInspectorProps) {
  const activeLayout = resolveLayoutAlgorithm(activeOption?.artParams ?? {});
  const effectiveGeometry = getEffectiveGeometryLabel(activeLayout);

  return (
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
              status === 'done' ? 'bg-primary' : status === 'active' ? 'bg-primary/70 animate-pulse' : 'bg-muted';

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
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Algorithm</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p className="text-muted-foreground">Render Algorithm</p>
            <p className="text-right text-xs leading-5">{activeOption?.artParams.renderAlgorithm ?? 'legacy-shapes'}</p>
            <p className="text-muted-foreground">Layout</p>
            <p className="text-right text-xs leading-5 capitalize">{activeLayout}</p>
            <p className="text-muted-foreground">Palette</p>
            <p className="text-right text-xs leading-5">{activeOption?.artParams.paletteId ?? '-'}</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card/50 p-3 space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Layers3 className="w-3.5 h-3.5" />
            Composition
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {isLegacyLayout(activeLayout) ? (
              <>
                <p className="text-muted-foreground">Shape Types</p>
                <p className="text-right">{(activeOption?.artParams.shapeTypes ?? []).join(', ') || '-'}</p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">Effective Geometry</p>
                <p className="text-right">{effectiveGeometry}</p>
                <p className="text-muted-foreground">Shape Style</p>
                <p className="text-right capitalize">{activeOption?.artParams.shapeStyle ?? '-'}</p>
              </>
            )}
            <p className="text-muted-foreground">Complexity</p>
            <p className="text-right">{activeOption ? formatValue(activeOption.artParams.complexity) : '-'}</p>
            <p className="text-muted-foreground">Layers</p>
            <p className="text-right">{activeOption?.artParams.layerCount ?? '-'}</p>
            <p className="text-muted-foreground">Position Bias</p>
            <p className="text-right capitalize">{activeOption?.artParams.positionBias ?? '-'}</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card/50 p-3 space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Mood JSON</p>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-md border bg-muted/30 p-2 text-xs leading-5 text-foreground">
            {preview?.debug?.rawModelJson ? JSON.stringify(preview.debug.rawModelJson, null, 2) : '-'}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
