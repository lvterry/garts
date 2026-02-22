import { MoodAnalyzer, MoodResult } from '../types';

export class ClaudeMoodAnalyzer implements MoodAnalyzer {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY || '';
  }

  async extractMood(keyword: string): Promise<MoodResult> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: `You are an art mood analyzer. Analyze the keyword and return a mood descriptor. Return ONLY a single mood word from these options: serene, chaotic, joyful, melancholic, energetic, mysterious, peaceful, intense. Nothing else. Keyword: "${keyword}"`,
          },
        ],
      }),
    });

    const data = await response.json();
    const mood = data.content?.[0]?.text?.trim().toLowerCase() || 'neutral';

    return {
      mood: this.validateMood(mood),
      rawResponse: data,
    };
  }

  private validateMood(mood: string): string {
    const validMoods = [
      'serene',
      'chaotic',
      'joyful',
      'melancholic',
      'energetic',
      'mysterious',
      'peaceful',
      'intense',
    ];
    return validMoods.includes(mood) ? mood : 'neutral';
  }
}
