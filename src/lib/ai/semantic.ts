import { MoodResult, SemanticProfile, Tempo } from './types';

export const VALID_MOODS = [
  'serene',
  'chaotic',
  'joyful',
  'melancholic',
  'energetic',
  'mysterious',
  'peaceful',
  'intense',
  'neutral',
] as const;

const TEMPO_VALUES: Tempo[] = ['calm', 'medium', 'fast'];
type PipelinePath = 'direct-semantic' | 'expand-then-extract';

const moodDefaults: Record<string, { energy: number; valence: number; tempo: Tempo }> = {
  serene: { energy: 0.25, valence: 0.35, tempo: 'calm' },
  chaotic: { energy: 0.9, valence: -0.15, tempo: 'fast' },
  joyful: { energy: 0.75, valence: 0.85, tempo: 'fast' },
  melancholic: { energy: 0.2, valence: -0.7, tempo: 'calm' },
  energetic: { energy: 0.95, valence: 0.45, tempo: 'fast' },
  mysterious: { energy: 0.45, valence: -0.1, tempo: 'medium' },
  peaceful: { energy: 0.2, valence: 0.5, tempo: 'calm' },
  intense: { energy: 0.85, valence: -0.2, tempo: 'fast' },
  neutral: { energy: 0.5, valence: 0, tempo: 'medium' },
};

const moodKeywordHints: Record<string, string[]> = {
  joyful: ['happy', 'joy', 'love', 'sunny', 'playful', 'celebration'],
  melancholic: ['sad', 'rain', 'alone', 'loss', 'nostalgia', 'blue'],
  serene: ['quiet', 'gentle', 'soft', 'mist', 'zen'],
  peaceful: ['calm', 'peace', 'still', 'meditation', 'harmony'],
  energetic: ['party', 'dance', 'sport', 'electric', 'burst'],
  chaotic: ['storm', 'chaos', 'noise', 'glitch', 'wild'],
  mysterious: ['night', 'shadow', 'fog', 'secret', 'dream'],
  intense: ['fire', 'rage', 'battle', 'power', 'explosion'],
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toNumber(input: unknown, fallback: number): number {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return input;
  }
  if (typeof input === 'string') {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function normalizeTextList(input: unknown, maxItems = 6): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const normalized = input
    .map((item) => String(item).trim().toLowerCase())
    .filter((item) => item.length > 0)
    .map((item) => item.replace(/[^\w\s-]/g, ''))
    .filter((item) => item.length > 0);

  return Array.from(new Set(normalized)).slice(0, maxItems);
}

function normalizeTempo(input: unknown, fallback: Tempo): Tempo {
  const value = String(input ?? '').trim().toLowerCase();
  if (TEMPO_VALUES.includes(value as Tempo)) {
    return value as Tempo;
  }
  return fallback;
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  const candidate = text.slice(start, end + 1);
  try {
    const parsed = JSON.parse(candidate);
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function normalizeMood(mood: unknown, fallback = 'neutral'): string {
  const value = String(mood ?? '').trim().toLowerCase();
  return VALID_MOODS.includes(value as (typeof VALID_MOODS)[number]) ? value : fallback;
}

function inferMoodFromKeyword(keyword: string): string {
  const normalizedKeyword = keyword.toLowerCase();

  for (const [mood, hints] of Object.entries(moodKeywordHints)) {
    if (hints.some((hint) => normalizedKeyword.includes(hint))) {
      return mood;
    }
  }

  return 'neutral';
}

export function buildPrompt(keyword: string, pipelinePath: 'direct-semantic' | 'expand-then-extract'): string {
  const shouldExpand = pipelinePath === 'expand-then-extract';

  return [
    'You are an art intent analyzer.',
    'Return ONLY valid JSON. No markdown, no explanation.',
    'Use this exact schema:',
    '{',
    '  "mood": "serene|chaotic|joyful|melancholic|energetic|mysterious|peaceful|intense|neutral",',
    '  "confidence": 0..1,',
    '  "semanticProfile": {',
    '    "coreMood": "same enum as mood",',
    '    "energy": 0..1,',
    '    "valence": -1..1,',
    '    "tempo": "calm|medium|fast",',
    '    "imageryTags": ["short tags"],',
    '    "styleHints": ["short tags"],',
    '    "expandedPrompt": "optional short scene (1-2 lines, only when input is sparse)"',
    '  }',
    '}',
    shouldExpand
      ? 'Input is sparse. First infer a concise scene description, then extract fields.'
      : 'Use the user input directly without inventing unrelated details.',
    `User input: "${keyword}"`,
  ].join('\n');
}

function buildFallbackProfile(
  keyword: string,
  mood: string,
  pipelinePath: PipelinePath
): SemanticProfile {
  const defaults = moodDefaults[mood] || moodDefaults.neutral;
  return {
    coreMood: mood,
    energy: defaults.energy,
    valence: defaults.valence,
    tempo: defaults.tempo,
    imageryTags: keyword
      .split(/\s+/)
      .map((word) => word.trim().toLowerCase())
      .filter((word) => word.length > 2)
      .slice(0, 4),
    styleHints: [],
    pipelinePath,
  };
}

export function parseModelSemanticResponse(
  content: string | null | undefined,
  keyword: string,
  pipelinePath: PipelinePath
): Omit<MoodResult, 'rawResponse'> {
  const inferredMood = inferMoodFromKeyword(keyword);
  const fallbackProfile = buildFallbackProfile(keyword, inferredMood, pipelinePath);

  if (!content) {
    return {
      mood: inferredMood,
      confidence: 0.2,
      semanticProfile: fallbackProfile,
    };
  }

  const parsed = extractJsonObject(content);
  if (!parsed) {
    return {
      mood: inferredMood,
      confidence: 0.2,
      semanticProfile: fallbackProfile,
    };
  }

  const parsedMood = normalizeMood(
    parsed.mood ?? (parsed.semanticProfile as Record<string, unknown> | undefined)?.coreMood,
    inferredMood
  );
  const defaults = moodDefaults[parsedMood] || moodDefaults.neutral;
  const semanticProfile = (parsed.semanticProfile ?? {}) as Record<string, unknown>;

  const expandedPromptRaw = typeof semanticProfile.expandedPrompt === 'string'
    ? semanticProfile.expandedPrompt.trim()
    : '';

  return {
    mood: parsedMood,
    confidence: clamp(toNumber(parsed.confidence, 0.5), 0, 1),
    semanticProfile: {
      coreMood: normalizeMood(semanticProfile.coreMood, parsedMood),
      energy: clamp(toNumber(semanticProfile.energy, defaults.energy), 0, 1),
      valence: clamp(toNumber(semanticProfile.valence, defaults.valence), -1, 1),
      tempo: normalizeTempo(semanticProfile.tempo, defaults.tempo),
      imageryTags: normalizeTextList(semanticProfile.imageryTags),
      styleHints: normalizeTextList(semanticProfile.styleHints),
      expandedPrompt: expandedPromptRaw ? expandedPromptRaw.slice(0, 220) : undefined,
      pipelinePath: expandedPromptRaw ? 'expand-then-extract' : pipelinePath,
    },
  };
}

export function shouldUseExpansion(keyword: string): boolean {
  const tokens = keyword.trim().split(/\s+/).filter(Boolean);
  return tokens.length <= 2;
}

export function choosePipelinePath(keyword: string): PipelinePath {
  const strategy = (process.env.SEMANTIC_PIPELINE_MODE || 'auto').toLowerCase();
  if (strategy === 'direct') {
    return 'direct-semantic';
  }
  if (strategy === 'expand') {
    return 'expand-then-extract';
  }
  return shouldUseExpansion(keyword) ? 'expand-then-extract' : 'direct-semantic';
}
