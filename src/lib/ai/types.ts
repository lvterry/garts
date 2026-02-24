export type Tempo = 'calm' | 'medium' | 'fast';

export interface SemanticProfile {
  coreMood: string;
  energy: number;
  valence: number;
  tempo: Tempo;
  imageryTags: string[];
  styleHints: string[];
  expandedPrompt?: string;
  pipelinePath?: 'direct-semantic' | 'expand-then-extract';
}

export interface MoodResult {
  mood: string;
  confidence?: number;
  semanticProfile?: SemanticProfile;
  rawResponse?: unknown;
}

export interface MoodAnalyzer {
  extractMood(keyword: string): Promise<MoodResult>;
}
