# Garts - Generative Art Gallery

Generate unique art based on mood keywords using AI.

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Database**: Turso (libSQL/SQLite)
- **ORM**: Prisma
- **AI**: Kimi K2.5 (Moonshot AI) - with abstraction for OpenAI/Claude
- **Art Engine**: p5.js

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database (Turso)
DATABASE_URL="libsql://your-database.turso.io"

# AI Provider (kimi, openai, claude)
AI_PROVIDER="kimi"
KIMI_API_KEY="your-kimi-api-key"
```

### 3. Set Up Database

Create a Turso database:
1. Go to [turso.tech](https://turso.tech)
2. Create a new database
3. Get the connection URL
4. Update `DATABASE_URL` in `.env`

Generate Prisma client:
```bash
npx prisma generate
```

Push schema to database:
```bash
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `AI_PROVIDER`
   - `KIMI_API_KEY`
4. Deploy

## Project Structure

```
src/
├── app/
│   ├── api/art/           # API routes
│   │   ├── generate/      # Generate new art
│   │   ├── [id]/          # Get/delete individual art
│   │   └── route.ts       # List all arts
│   ├── art/[id]/          # Art detail page
│   ├── gallery/           # Gallery page
│   ├── page.tsx           # Home page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ArtCanvas.tsx      # p5.js canvas
│   ├── KeywordInput.tsx   # Keyword input form
│   └── GalleryGrid.tsx    # Art grid display
└── lib/
    ├── ai/                # AI provider abstraction
    │   ├── providers/     # Kimi, OpenAI, Claude
    │   ├── factory.ts     # Provider factory
    │   └── types.ts       # Type definitions
    └── art-generator/     # Art generation logic
```

## Switching AI Providers

Set `AI_PROVIDER` environment variable:
- `kimi` - Kimi K2.5 (default)
- `openai` - OpenAI GPT-4
- `claude` - Anthropic Claude

All providers implement the same interface for easy switching.

## License

MIT
