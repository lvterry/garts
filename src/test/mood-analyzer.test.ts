import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMoodAnalyzer } from '@/lib/ai';

describe('createMoodAnalyzer', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('AI_PROVIDER', 'kimi');
  });

  it('returns a mood analyzer instance', () => {
    const analyzer = createMoodAnalyzer();
    expect(analyzer).toBeDefined();
    expect(analyzer).toHaveProperty('extractMood');
    expect(typeof analyzer.extractMood).toBe('function');
  });

  it('extracts mood from a keyword', async () => {
    const analyzer = createMoodAnalyzer();
    const result = await analyzer.extractMood('sunset');
    
    expect(result).toHaveProperty('mood');
    expect(typeof result.mood).toBe('string');
    expect(result.mood.length).toBeGreaterThan(0);
  });

  it('returns consistent moods for similar keywords', async () => {
    const analyzer = createMoodAnalyzer();
    
    const result1 = await analyzer.extractMood('happy');
    const result2 = await analyzer.extractMood('joy');
    
    expect(result1.mood).toBe(result2.mood);
  });

  it('handles different mood keywords', async () => {
    const analyzer = createMoodAnalyzer();
    
    const validMoods = [
      'serene',
      'chaotic',
      'melancholic',
      'joyful',
      'energetic',
      'mysterious',
      'peaceful',
      'intense',
      'neutral',
      'nostalgic',
      'romantic',
      'playful',
      'ominous',
      'ethereal',
      'gritty',
    ];
    
    const testKeywords = ['peaceful', 'chaos', 'sadness', 'happy', 'excited', 'mystery', 'calm', 'intense', 'okay'];
    
    for (const keyword of testKeywords) {
      const result = await analyzer.extractMood(keyword);
      const mood = result.mood.toLowerCase();
      const isValidMood = validMoods.some(m => mood.includes(m) || m.includes(mood));
      expect(isValidMood, `Expected valid mood for "${keyword}", got "${result.mood}"`).toBe(true);
    }
  });
});
