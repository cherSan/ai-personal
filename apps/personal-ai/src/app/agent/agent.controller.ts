import {Controller, Post, Body, BadRequestException} from '@nestjs/common';
import {AgentService} from "./agent.service";

interface SearchDocumentDto {
  q: string;
  limit?: number;
}

@Controller('agent')
export class AgentController {
  constructor(
    private readonly agent: AgentService,
  ) {}

  @Post()
  async searchDocuments(@Body() body: SearchDocumentDto) {
    if (!body.q) {
      throw new BadRequestException('Fields "q" (query) and "meta.section" are required');
    }

    return this.agent.invoke(body.q);
  }
}
