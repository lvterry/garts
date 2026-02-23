# Garts - Agent Instructions

## Project Overview
- **Project**: Garts - Generative Art Gallery
- **Tech Stack**: Next.js 14 (App Router), Turso/libSQL, Prisma, p5.js, AI (Kimi/OpenAI/Claude)
- **Repository**: https://github.com/lvterry/garts

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run vitest tests |

## Code Conventions

- **Language**: TypeScript
- **Styling**: Tailwind CSS with `tailwind-merge` and `clsx`
- **Testing**: Vitest with `vitest.run`
- **Imports**: Use `@/` alias for `src/` (e.g., `@/lib/art-generator`)
- **Components**: React Server Components by default, `"use client"` for interactivity
- **API**: Next.js Route Handlers in `src/app/api/`

## Key Files

| Path | Purpose |
|------|---------|
| `src/lib/art-generator/index.ts` | Core art generation logic (colors, shapes, moods) |
| `src/lib/ai/` | AI provider abstraction (Kimi, OpenAI, Claude) |
| `src/components/SvgArtCanvas.tsx` | SVG-based art renderer |
| `src/app/api/art/generate/route.ts` | Art generation API endpoint |

## Environment Variables

```env
DATABASE_URL="libsql://..."
AI_PROVIDER="kimi"  # or "openai", "claude"
KIMI_API_KEY="..."
```

## Important Notes

- Always run `npm run build` and `npm run test` before committing
- Art generation supports two algorithms: `'single'` (1 shape type) and `'mixed'` (1-3 shape types)
- Colors use HSL format with lightness ranges defined per mood in `moodToParams`
- Prisma client auto-generates on `npm install` (postinstall hook)
