import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {LlmModule} from "./llm/llm.module";
import {DocumentsModule} from "./documents/documents.module";
import {DatabaseModule} from "./database/database.module";
import {EmbeddingModule} from "./embedding/embedding.module";
import {AuthModule} from "./auth/auth.module";
import {AgentModule} from "./agent/agent.module";

@Module({
  imports: [
    LlmModule,
    DocumentsModule,
    DatabaseModule,
    EmbeddingModule,
    AuthModule,
    AgentModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
