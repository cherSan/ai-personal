import {HttpException, Injectable} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

export type Meta = {
  section?: 'projects' | 'teams' | 'companies' | 'posts' | 'technologies' | 'skills' | 'biography' | 'news' | string;
}

@Injectable()
export class EmbeddingService {
  private readonly ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });
  }

  async embed(contents: string): Promise<number[]> {
    try {
      const response = await this.ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents,
      });

      const embedding = response.embeddings?.[0]?.values;

      if (!embedding) {
        throw new Error('Gemini returned empty embedding');
      }

      return embedding;
    } catch (error: any) {
      throw new HttpException(error?.message, error?.status)
    }
  }
}
