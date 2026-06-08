import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class LLMService {
  private readonly ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });
  }

  async llm(searchResults: string[], userQuery: string): Promise<string> {
    const contextText = searchResults.join('\n\n-----------------\n\n');
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `
      You are my personal assistant and presenter! You know everything about me!
      If someone ask - you should answer. Do not provide critical data as Bank Accounts Number.
      You need to sell me fo any HR/recruter who ask you!
    `
      },
      contents: [
        {
          role: 'user',
          parts: [
            { text: `CONTEXT FROM DB:\n${contextText}` },
            { text: `USER QUESTION:\n${userQuery}` }
          ]
        }
      ]
    });

    return response.text || 'Something going wrong...';
  }
}
