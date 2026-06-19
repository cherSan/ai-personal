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

    const data = await this.agent.invoke(body.q);
    return {
      m: data?.message[data.message.length - 1]?.kwargs.content || 'No response from agent'
    };
  }
}
