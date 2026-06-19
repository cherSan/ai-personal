import {Injectable} from "@nestjs/common";
import {tool as agentTool} from "@langchain/core/tools";
import { z } from "zod";
import {Model} from "mongoose";
import {InjectModel} from "@nestjs/mongoose";
import {PersonalDocument} from "../database/personal-document.schema";
import {EmbeddingService} from "../embedding/embedding.service";

@Injectable()
export class PersonalDocumentService {
  constructor(
    @InjectModel(PersonalDocument.name)
    private readonly documentModel: Model<PersonalDocument>,
    private readonly embeddingService: EmbeddingService,
  ) {
  }

  tool = agentTool(
    async ({ query, limit = 5 }: { query: string, limit: number }): Promise<string> => {
      try {
        const queryEmbedding = await this.embeddingService.embed(query);
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
        const out = data.map((d) => {
          const sectionContext = d.metadata?.section ? `\n\n#SECTION: ${d.metadata.section}` : '';
          return `<personal_document_collection_record>#TITLE:${d.title}${sectionContext}\n\n---\n\n${d.content}</personal_document_collection_record>`;
        });
        return `<personal_document_collection>${out.join("\n")}</personal_document_collection>`;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return `<personal_document_collection><personal_document_collection_error>Fetch failed: ${msg}</personal_document_collection_error></personal_document_collection>`;
      }
    },
    {
      name: "fetch_text_from_personal_document_collection",
      description: "Fetch the document from a Vector Personal Document Collection who contain all my personal information.",
      schema: z.object({ query: z.string(), limit: z.number().optional() }),
    },
  )
}
