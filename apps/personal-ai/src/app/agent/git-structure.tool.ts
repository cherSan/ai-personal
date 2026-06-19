import { Injectable } from "@nestjs/common";
import { tool as agentTool } from "@langchain/core/tools";
import { z } from "zod";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { GitDocument } from "../database/git-document.schema";

@Injectable()
export class GitStructureToolService {
  constructor(
    @InjectModel(GitDocument.name) private readonly gitDocModel: Model<GitDocument>
  ) {}

  tool = agentTool(
    async ({ projectName }: { projectName: string }): Promise<string> => {
      try {
        const files = await this.gitDocModel.find({ projectName }).distinct("title").exec();
        if (files.length === 0) {
          return `<git_project_structure project="${projectName}">No indexed files found for this project name.</git_project_structure>`;
        }
        return `<git_project_structure project="${projectName}">
          <indexed_files>${files.join(", ")}</indexed_files>
        </git_project_structure>`;
      } catch (e) {
        return `<git_structure_error>Failed to fetch structure: ${e instanceof Error ? e.message : String(e)}</git_structure_error>`;
      }
    },
    {
      name: "get_git_project_file_structure",
      description: "Fetches a complete list of file paths/names available inside one specific repository name. Useful for figuring out where specific architecture components live before reading code.",
      schema: z.object({
        projectName: z.string().describe("The exact name of the repository to inspect"),
      }),
    }
  );
}
