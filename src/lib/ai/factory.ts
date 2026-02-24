import { MoodAnalyzer } from './types';
import { KimiMoodAnalyzer } from './providers/kimi';
import { OpenAIMoodAnalyzer } from './providers/openai';
import { ClaudeMoodAnalyzer } from './providers/claude';

const PROVIDER = process.env.AI_PROVIDER?.toLowerCase() || 'kimi';

export function createMoodAnalyzer(): MoodAnalyzer {
  switch (PROVIDER) {
    case 'openai':
      return new OpenAIMoodAnalyzer();
    case 'claude':
      return new ClaudeMoodAnalyzer();
    case 'kimi':
    default:
      return new KimiMoodAnalyzer();
  }
}

export type { MoodAnalyzer, MoodResult, SemanticProfile, Tempo } from './types';
