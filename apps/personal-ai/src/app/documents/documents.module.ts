import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import {LlmModule} from "../llm/llm.module";
import { PersonalDocumentsService } from './personal-documents.service';
import { PersonalDocumentsController } from "./personal-documents.controller";

@Module({
  imports: [
    DatabaseModule,
    EmbeddingModule,
    LlmModule,
  ],
  controllers: [PersonalDocumentsController],
  providers: [PersonalDocumentsService],
  exports: [PersonalDocumentsService],
})
export class DocumentsModule {}
