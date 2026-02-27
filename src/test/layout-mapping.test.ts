import { describe, expect, it } from 'vitest';
import {
  isLegacyLayout,
  layoutToRenderAlgorithm,
  renderToLayoutAlgorithm,
  resolveLayoutAlgorithm,
} from '@/lib/art/layout';

describe('layout mapping', () => {
  it('roundtrips non-legacy layout and render values', () => {
    const layouts = ['flow-field', 'voronoi', 'delaunay', 'attractors'] as const;

    for (const layout of layouts) {
      const render = layoutToRenderAlgorithm(layout);
      expect(renderToLayoutAlgorithm(render)).toBe(layout);
      expect(resolveLayoutAlgorithm({ layoutAlgorithm: layout })).toBe(layout);
    }
  });

  it('falls back to legacy mapping', () => {
    expect(renderToLayoutAlgorithm('legacy-shapes')).toBe('legacy');
    expect(layoutToRenderAlgorithm('legacy')).toBe('legacy-shapes');
    expect(resolveLayoutAlgorithm({ renderAlgorithm: 'legacy-shapes' })).toBe('legacy');
    expect(isLegacyLayout('legacy')).toBe(true);
  });
});
