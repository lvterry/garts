import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('Generation Inspector structure', () => {
  const pagePath = path.resolve(process.cwd(), 'src/app/page.tsx');
  const source = readFileSync(pagePath, 'utf8');

  it('keeps only three target inspector sections', () => {
    expect(source).toContain('Algorithm');
    expect(source).toContain('Composition');
    expect(source).toContain('Mood JSON');

    expect(source).not.toContain('Input & Identity');
    expect(source).not.toContain('Dynamics');
    expect(source).not.toContain('Styling');
    expect(source).not.toContain('Colors');
  });

  it('shows composition fields by effective layout semantics', () => {
    expect(source).toContain('resolveEffectiveLayout');
    expect(source).toContain('isLegacyLayout');
    expect(source).toContain('getEffectiveGeometryLabel');
    expect(source).toContain('Effective Geometry');
    expect(source).toContain('Shape Types');
    expect(source).toContain("return 'triangulation'");
    expect(source).toContain("return 'voronoi cells'");
    expect(source).toContain("return 'particle paths'");
    expect(source).toContain("return 'attractor particles'");
  });

  it('formats mood json and keeps scrollable container', () => {
    expect(source).toContain('JSON.stringify(preview.debug.rawModelJson, null, 2)');
    expect(source).toContain(": '-'}");
    expect(source).toContain('max-h-64 overflow-auto');
    expect(source).toContain('whitespace-pre-wrap break-all');
  });
});
