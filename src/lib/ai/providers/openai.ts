import OpenAI from 'openai';
import { MoodAnalyzer, MoodResult } from '../types';
import { buildPrompt, choosePipelinePath, parseModelSemanticResponse } from '../semantic';

export class OpenAIMoodAnalyzer implements MoodAnalyzer {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async extractMood(keyword: string): Promise<MoodResult> {
    const pipelinePath = choosePipelinePath(keyword);

    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a strict JSON API that returns art semantic analysis.',
        },
        {
          role: 'user',
          content: buildPrompt(keyword, pipelinePath),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    const parsed = parseModelSemanticResponse(content, keyword, pipelinePath);

    return {
      ...parsed,
      rawResponse: completion,
    };
  }
}
