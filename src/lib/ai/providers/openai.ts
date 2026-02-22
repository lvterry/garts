import OpenAI from 'openai';
import { MoodAnalyzer, MoodResult } from '../types';

export class OpenAIMoodAnalyzer implements MoodAnalyzer {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async extractMood(keyword: string): Promise<MoodResult> {
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an art mood analyzer. Analyze the keyword and return a mood descriptor. Return ONLY a single mood word from these options: serene, chaotic, joyful, melancholic, energetic, mysterious, peaceful, intense. Nothing else.',
        },
        {
          role: 'user',
          content: `Keyword: "${keyword}"`,
        },
      ],
    });

    const mood = completion.choices[0]?.message?.content?.trim().toLowerCase() || 'neutral';

    return {
      mood: this.validateMood(mood),
      rawResponse: completion,
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
