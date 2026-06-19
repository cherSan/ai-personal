import { Module } from '@nestjs/common';
import {DatabaseModule} from "../database/database.module";
import {EmbeddingModule} from "../embedding/embedding.module";
import {PersonalDocumentService} from "./personal-document.service";
import {AgentController} from "./agent.controller";
import {AgentService} from "./agent.service";
import {GitCodeSearchToolService} from "./git-code-search.tool";
import {GitMetadataToolService} from "./git-metadata.tool";
import {GitStructureToolService} from "./git-structure.tool";

@Module({
  imports: [
    DatabaseModule,
    EmbeddingModule,
  ],
  controllers: [
    AgentController
  ],
  providers: [
    PersonalDocumentService,
    GitCodeSearchToolService,
    GitMetadataToolService,
    GitStructureToolService,
    AgentService,
  ],
  exports: [
    PersonalDocumentService,
    GitCodeSearchToolService,
    GitMetadataToolService,
    GitStructureToolService,
    AgentService,
  ],
})
export class AgentModule {}
