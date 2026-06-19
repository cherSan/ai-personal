import { Injectable } from "@nestjs/common";
import { tool as agentTool } from "@langchain/core/tools";
import { z } from "zod";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { GitDocument } from "../database/git-document.schema";

@Injectable()
export class GitMetadataToolService {
  constructor(
    @InjectModel(GitDocument.name) private readonly gitDocModel: Model<GitDocument>
  ) {}

  tool = agentTool(
    async (): Promise<string> => {
      try {
        const uniqueProjects = await this.gitDocModel.distinct("projectName").exec();
        return `<git_projects_catalog>
          <total_projects_count>${uniqueProjects.length}</total_projects_count>
          <projects_list>${uniqueProjects.join(", ")}</projects_list>
        </git_projects_catalog>`;
      } catch (e) {
        return `<git_metadata_error>Failed to pull catalog: ${e instanceof Error ? e.message : String(e)}</git_metadata_error>`;
      }
    },
    {
      name: "get_git_projects_catalog",
      description: "Use this tool ONLY to find the total count of available repositories and a list of their names. Do not use this if you need actual source code logic.",
      schema: z.object({})
    }
  );
}
