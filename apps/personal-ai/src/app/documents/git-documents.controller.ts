import { Controller, Post } from '@nestjs/common';
import { GitDocumentsService } from "./git-documents.service";

@Controller('git-documents')
export class GitDocumentsController {
  constructor(
    private readonly gitDocumentsService: GitDocumentsService,
  ) {}

  @Post('sync')
  async syncGitData() {
    this.gitDocumentsService.runPipeline().catch((err) => {
      console.error('❌ Ошибка фонового пайплайна векторизации Git:', err.message);
    });

    return {
      status: 'processing',
      message: 'Пайплайн умной векторизации репозиториев успешно запущен в фоновом режиме!',
    };
  }
}
