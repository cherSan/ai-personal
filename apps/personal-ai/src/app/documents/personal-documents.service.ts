import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PersonalDocument } from '../database/personal-document.schema';
import { EmbeddingService, Meta } from '../embedding/embedding.service';

export interface SmartSearchResult {
  _id: string;
  title: string;
  content: string;
  metadata: {
    section: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
  vectorScore: number;
  ageInDays: number;
  finalScore: number;
}

@Injectable()
export class PersonalDocumentsService {
  constructor(
    @InjectModel(PersonalDocument.name)
    private readonly documentModel: Model<PersonalDocument>,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async createAndSaveVector(title: string, content: string, meta: Meta) {
    try {
      const sectionContext = meta?.section ? `\nSECTION: ${meta.section}` : '';
      const contents = `TITLE: ${title}${sectionContext}\n---\nCONTEXT: ${content}`;
      const embedding = await this.embeddingService.embed(contents);

      if (embedding.length !== 3072) {
        throw new Error(`Invalid embedding size: ${embedding.length}. Expected 3072.`);
      }

      const newDocument = new this.documentModel({
        title,
        content,
        embedding,
        metadata: meta,
      });

      return await newDocument.save();
    } catch (error: any) {
      throw new InternalServerErrorException(error.message || 'Failed to process document');
    }
  }

  async findSmartSimilarDocuments(q: string, limit = 5) {
    try {
      const queryEmbedding = await this.embeddingService.embed(q);

      const numCandidates = Math.max(limit * 10, 50);

      const data = await this.documentModel.aggregate([
        {
          $vectorSearch: {
            index: 'personal_vector_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: numCandidates,
            limit: limit,
          },
        },
        {
          $project: {
            title: 1,
            content: 1,
            metadata: 1,
            createdAt: 1,
            vectorScore: { $meta: 'vectorSearchScore' },
          },
        },
      ]);

      console.log('--- ОТЛАДКА РЕЗУЛЬТАТОВ ---');
      console.log('Вектор запроса (первые 3 числа):', queryEmbedding.slice(0, 3));
      console.log('Найдено документов:', data.length);
      console.log('Сами документы:', JSON.stringify(data, null, 2));
      return data.map((d) => {
        const sectionContext = d?.metadata.section ? `\nSECTION: ${d.metadata.section}` : '';
        return `TITLE: ${d.title}${sectionContext}\n---\nCONTEXT: ${d.content}`;
      })
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Production RAG Search failed: ${error.message}`,
      );
    }
  }
}
