import {Controller, Post, Body, BadRequestException, UseGuards} from '@nestjs/common';
import { PersonalDocumentsService } from './personal-documents.service';
import { Meta } from '../embedding/embedding.service';
import {LLMService} from "../llm/llm.service";
import {GoogleAdminGuard} from "../common/guards/google-auth.guard";

interface CreateDocumentDto {
  title: string;
  text: string;
  meta?: Meta;
}

interface SearchDocumentDto {
  q: string;
  limit?: number;
}

@Controller('personal-documents')
export class PersonalDocumentsController {
  constructor(
    private readonly documentsService: PersonalDocumentsService,
    private readonly llmSerive: LLMService,
  ) {}

  @Post()
  @UseGuards(GoogleAdminGuard)
  async createDocument(@Body() body: CreateDocumentDto) {
    if (!body.title || !body.text || !body.meta?.section) {
      throw new BadRequestException('Fields "title", "text" and "meta.section" are required');
    }

    const savedDoc = await this.documentsService.createAndSaveVector(
      body.title,
      body.text,
      body.meta,
    );

    return {
      id: savedDoc._id,
      title: savedDoc.title,
      section: savedDoc.metadata?.section,
      message: 'Document and vectors successfully saved to Atlas!',
    };
  }

  @Post('search')
  async searchDocuments(@Body() body: SearchDocumentDto) {
    if (!body.q) {
      throw new BadRequestException('Fields "q" (query) and "meta.section" are required');
    }

    const results = await this.documentsService.findSmartSimilarDocuments(
      body.q,
      body.limit || 5,
    );

    return this.llmSerive.llm(
      results,
      body.q,
    );
  }
}
