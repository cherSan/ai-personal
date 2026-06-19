import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import {LlmModule} from "../llm/llm.module";
import { PersonalDocumentsService } from './personal-documents.service';
import { PersonalDocumentsController } from "./personal-documents.controller";
import { GitDocumentsController } from "./git-documents.controller";
import { GitDocumentsService } from "./git-documents.service";

@Module({
  imports: [
    DatabaseModule,
    EmbeddingModule,
    LlmModule,
  ],
  controllers: [PersonalDocumentsController, GitDocumentsController],
  providers: [PersonalDocumentsService, GitDocumentsService],
  exports: [PersonalDocumentsService, GitDocumentsService],
})
export class DocumentsModule {}
