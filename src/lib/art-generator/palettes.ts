import type { PaletteFamily } from '@/lib/art/types';

export interface CuratedPalette {
  id: string;
  name: string;
  family: PaletteFamily;
  moods: string[];
  tags: string[];
  colors: string[];
  background: string[];
}

const CURATED_PALETTES: CuratedPalette[] = [
  {
    id: 'coastal-dawn',
    name: 'Coastal Dawn',
    family: 'coolors-inspired',
    moods: ['serene', 'peaceful', 'ethereal'],
    tags: ['ocean', 'sky', 'minimal'],
    colors: ['#7BDFF2', '#B2F7EF', '#EFF7F6', '#F7D6E0', '#F2B5D4'],
    background: ['#0B1D2A', '#102A3B', '#193549'],
  },
  {
    id: 'city-pop',
    name: 'City Pop',
    family: 'coolors-inspired',
    moods: ['energetic', 'joyful', 'playful'],
    tags: ['city', 'neon', 'bold'],
    colors: ['#FFBE0B', '#FB5607', '#FF006E', '#8338EC', '#3A86FF'],
    background: ['#090B18', '#11142B', '#1A1F3F'],
  },
  {
    id: 'burnt-echo',
    name: 'Burnt Echo',
    family: 'chromotome-inspired',
    moods: ['nostalgic', 'gritty', 'melancholic'],
    tags: ['earth', 'film', 'dusty'],
    colors: ['#B56576', '#E56B6F', '#EAAC8B', '#6D597A', '#355070'],
    background: ['#1E1A22', '#2A2433', '#17141B'],
  },
  {
    id: 'forest-ink',
    name: 'Forest Ink',
    family: 'chromotome-inspired',
    moods: ['mysterious', 'ominous', 'neutral'],
    tags: ['forest', 'night', 'organic'],
    colors: ['#2D6A4F', '#40916C', '#95D5B2', '#D8F3DC', '#1B4332'],
    background: ['#0A1914', '#10231D', '#152F26'],
  },
  {
    id: 'violet-pulse',
    name: 'Violet Pulse',
    family: 'generativepalettes-inspired',
    moods: ['intense', 'romantic', 'chaotic'],
    tags: ['pulse', 'contrast', 'dramatic'],
    colors: ['#0E0F19', '#A01A7D', '#D7263D', '#F49D37', '#3F88C5'],
    background: ['#07070F', '#0D1020', '#14192E'],
  },
  {
    id: 'sunlit-signal',
    name: 'Sunlit Signal',
    family: 'generativepalettes-inspired',
    moods: ['joyful', 'playful', 'energetic'],
    tags: ['sun', 'graphic', 'warm'],
    colors: ['#F4D35E', '#EE964B', '#F95738', '#0D3B66', '#FAF0CA'],
    background: ['#101820', '#18232E', '#0D2538'],
  },
  {
    id: 'moon-garden',
    name: 'Moon Garden',
    family: 'coolors-inspired',
    moods: ['serene', 'melancholic', 'mysterious'],
    tags: ['moon', 'mist', 'soft'],
    colors: ['#A8DADC', '#457B9D', '#1D3557', '#F1FAEE', '#B8C0FF'],
    background: ['#0A1325', '#0E1B30', '#13253B'],
  },
  {
    id: 'tidewire',
    name: 'Tidewire',
    family: 'chromotome-inspired',
    moods: ['ethereal', 'peaceful', 'nostalgic'],
    tags: ['coast', 'haze', 'calm'],
    colors: ['#89C2D9', '#61A5C2', '#468FAF', '#2C7DA0', '#014F86'],
    background: ['#071A2A', '#0C2437', '#123245'],
  },
  {
    id: 'signal-noir',
    name: 'Signal Noir',
    family: 'generativepalettes-inspired',
    moods: ['chaotic', 'intense', 'ominous'],
    tags: ['noir', 'tech', 'hard'],
    colors: ['#00F5D4', '#00BBF9', '#F15BB5', '#9B5DE5', '#FEE440'],
    background: ['#080713', '#111028', '#19183A'],
  },
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function rotate<T>(arr: T[], offset: number): T[] {
  if (arr.length === 0) {
    return arr;
  }
  const safeOffset = ((offset % arr.length) + arr.length) % arr.length;
  return [...arr.slice(safeOffset), ...arr.slice(0, safeOffset)];
}

function weightedPick<T>(seed: number, entries: Array<{ item: T; weight: number }>): T {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let pick = seededRandom(seed) * Math.max(0.001, total);

  for (const entry of entries) {
    pick -= entry.weight;
    if (pick <= 0) {
      return entry.item;
    }
  }

  return entries[entries.length - 1].item;
}

function scorePalette(mood: string, palette: CuratedPalette, imageryTags: string[]): number {
  let score = 1;

  if (palette.moods.includes(mood)) {
    score += 2.2;
  }

  for (const tag of imageryTags) {
    if (palette.tags.includes(tag.toLowerCase())) {
      score += 0.6;
    }
  }

  return score;
}

function resolveFamily(mood: string, valence: number, seed: number): PaletteFamily {
  const calmMoods = new Set(['serene', 'peaceful', 'ethereal', 'melancholic']);
  const intenseMoods = new Set(['chaotic', 'intense', 'energetic', 'ominous']);

  const entries: Array<{ item: PaletteFamily; weight: number }> = [
    { item: 'coolors-inspired', weight: calmMoods.has(mood) ? 2.4 : 1.1 },
    { item: 'chromotome-inspired', weight: mood === 'nostalgic' || mood === 'gritty' ? 2.6 : 1.2 },
    {
      item: 'generativepalettes-inspired',
      weight: intenseMoods.has(mood) ? 2.5 : valence > 0.25 ? 1.6 : 1.1,
    },
  ];

  return weightedPick(seed + 41, entries);
}

export function selectCuratedPalette(params: {
  mood: string;
  seed: number;
  valence: number;
  imageryTags: string[];
}): {
  paletteId: string;
  paletteFamily: PaletteFamily;
  shapeColors: string[];
  backgroundColors: string[];
} {
  const family = resolveFamily(params.mood, params.valence, params.seed);
  const familyCandidates = CURATED_PALETTES.filter((palette) => palette.family === family);
  const fallbackCandidates = familyCandidates.length > 0 ? familyCandidates : CURATED_PALETTES;

  const weighted = fallbackCandidates.map((palette, index) => ({
    item: palette,
    weight: scorePalette(params.mood, palette, params.imageryTags) + seededRandom(params.seed + index * 17),
  }));

  const picked = weightedPick(params.seed + 91, weighted);
  const colorOffset = Math.floor(seededRandom(params.seed + 133) * picked.colors.length);
  const backgroundOffset = Math.floor(seededRandom(params.seed + 177) * picked.background.length);

  return {
    paletteId: picked.id,
    paletteFamily: picked.family,
    shapeColors: rotate(picked.colors, colorOffset),
    backgroundColors: rotate(picked.background, backgroundOffset),
  };
}

export function isKnownPaletteId(id: string): boolean {
  return CURATED_PALETTES.some((palette) => palette.id === id);
}
