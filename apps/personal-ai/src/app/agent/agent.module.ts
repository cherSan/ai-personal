import { Module } from '@nestjs/common';
import {DatabaseModule} from "../database/database.module";
import {EmbeddingModule} from "../embedding/embedding.module";
import {PersonalDocumentService} from "./personal-document.service";
import {AgentController} from "./agent.controller";
import {AgentService} from "./agent.service";

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
    AgentService,
  ],
  exports: [
    PersonalDocumentService,
    AgentService,
  ],
})
export class AgentModule {}
