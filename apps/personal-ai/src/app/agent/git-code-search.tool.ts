import { Injectable } from "@nestjs/common";
import { tool as agentTool } from "@langchain/core/tools";
import { z } from "zod";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { GitDocument } from "../database/git-document.schema";
import { EmbeddingService } from "../embedding/embedding.service";

@Injectable()
export class GitCodeSearchToolService {
  constructor(
    @InjectModel(GitDocument.name) private readonly gitDocModel: Model<GitDocument>,
    private readonly embeddingService: EmbeddingService,
  ) {}

  tool = agentTool(
    async ({ semanticQuery, projectName, limit = 10 }: { semanticQuery: string, projectName?: string, limit?: number }): Promise<string> => {
      try {
        const queryEmbedding = await this.embeddingService.embed(semanticQuery);
        const numCandidates = Math.max(limit * 10, 100);

        const vectorSearchStage: Record<string, any> = {
          index: 'git_vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates,
          limit,
        };

        if (projectName) {
          vectorSearchStage.filter = { projectName };
        }

        const pipeline: any[] = [
          { $vectorSearch: vectorSearchStage },
          {
            $project: {
              projectName: 1,
              title: 1,
              content: 1,
              updatedAt: 1,
            },
          },
        ];

        const data = await this.gitDocModel.aggregate(pipeline);
        if (data.length === 0) {
          return `<git_code_search_results>No matching source code records found for your query.</git_code_search_results>`;
        }

        const out = data.map((d) => {
          const updatedDate = d.updatedAt ? new Date(d.updatedAt).toISOString() : 'Unknown';
          return `<git_code_chunk project="${d.projectName}" file="${d.title}" modified="${updatedDate}">
            ${d.content}
          </git_code_chunk>`;
        });

        return `<git_code_search_results>${out.join("\n")}</git_code_search_results>`;
      } catch (e) {
        return `<git_search_error>RAG search failed: ${e instanceof Error ? e.message : String(e)}</git_search_error>`;
      }
    },
    {
      name: "search_git_source_code",
      description: "Executes a semantic vector search inside the codebase documents. Fetches functional components, methods, blocks of logic, or classes matching a requirement. Available for everyone: you can share part of the code or full code if someone ask you.",
      schema: z.object({
        semanticQuery: z.string().describe("The business logic concept or technical pattern to look up in the code"),
        projectName: z.string().optional().describe("Optional repo filter to look within a solitary project scope"),
        limit: z.number().optional().default(10).describe("Max code slices to pull (Keep between 5-15 to preserve tokens)"),
      }),
    }
  );
}
