export interface MoodResult {
  mood: string;
  confidence?: number;
  rawResponse?: unknown;
}

export interface MoodAnalyzer {
  extractMood(keyword: string): Promise<MoodResult>;
}
