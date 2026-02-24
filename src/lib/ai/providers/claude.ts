import { MoodAnalyzer, MoodResult } from '../types';
import { buildPrompt, choosePipelinePath, parseModelSemanticResponse } from '../semantic';

export class ClaudeMoodAnalyzer implements MoodAnalyzer {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY || '';
  }

  async extractMood(keyword: string): Promise<MoodResult> {
    const pipelinePath = choosePipelinePath(keyword);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content: buildPrompt(keyword, pipelinePath),
          },
        ],
      }),
    });

    const data = await response.json();
    const content = data.content?.[0]?.text;
    const parsed = parseModelSemanticResponse(content, keyword, pipelinePath);

    return {
      ...parsed,
      rawResponse: data,
    };
  }
}
