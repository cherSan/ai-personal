import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Octokit } from '@octokit/rest';
import { RecursiveCharacterTextSplitter, type SupportedTextSplitterLanguages } from '@langchain/textsplitters';
import { GitDocument } from "../database/git-document.schema";
import { EmbeddingService } from "../embedding/embedding.service";
import * as crypto from 'crypto';

export type SupportedLang = (typeof SupportedTextSplitterLanguages)[number];

@Injectable()
export class GitDocumentsService {
  private readonly octokit = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN });

  constructor(
    @InjectModel(GitDocument.name) private readonly gitDocModel: Model<GitDocument>,
    private readonly embeddingService: EmbeddingService
  ) {}

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private getLanguageFromExtension(filePath: string): SupportedLang | null {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        return 'js';
      case 'py':
        return 'python';
      case 'go':
        return 'go';
      case 'md':
        return 'markdown';
      case 'rs':
        return 'rust';
      case 'cpp':
      case 'hpp':
      case 'c':
      case 'h':
        return 'cpp';
      case 'java':
        return 'java';
      case 'html':
        return 'html';
      case 'sol':
        return 'sol';
      default:
        return null;
    }
  }

  public async runPipeline() {
    console.log('🏁 Запуск умного синтаксического инкрементального пайплайна...');

    try {
      const { data: repos } = await this.octokit.rest.repos.listForAuthenticatedUser({
        per_page: 100,
        sort: 'updated',
      });

      for (const repo of repos) {
        const projectName = repo.name;
        const owner = repo.owner.login;

        // Внедряем изолированный try-catch на уровень цикла репозиториев
        try {
          console.log(`📦 Анализ репозитория: ${owner}/${projectName}`);

          // Защита от пустых репозиториев, у которых нет инициализированных веток
          if (!repo.default_branch) {
            console.log(`⚠️ Репозиторий ${projectName} пропущен, так как у него нет дефолтной ветки (пустой репозиторий).`);
            continue;
          }

          const { data: treeData } = await this.octokit.rest.git.getTree({
            owner,
            repo: projectName,
            tree_sha: repo.default_branch,
            recursive: 'true',
          });

          const validFiles = treeData.tree.filter(file => {
            if (file.type !== 'blob' || !file.path) return false;

            const pathLower = file.path.toLowerCase();
            const fileName = pathLower.split('/').pop() || '';
            const ext = fileName.split('.').pop() || '';

            if (file.size && file.size > 512000) {
              console.log(`⚠️ Файл пропущен (превышен размер 500КБ): ${file.path}`);
              return false;
            }

            const ignoredDirectories = [
              'node_modules/', 'dist/', 'build/', '.next/', '.git/',
              'coverage/', '.nyc_output/', '.vscode/', '.idea/',
              '.serverless/', '.pnpm-store/', 'out/', 'target/'
            ];
            if (ignoredDirectories.some(dir => pathLower.includes(dir))) return false;

            const ignoredExtensions = [
              'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp',
              'mp4', 'mov', 'avi', 'mp3', 'wav',
              'ttf', 'woff', 'woff2', 'eot',
              'pdf', 'zip', 'tar', 'gz', 'rar', '7z',
              'exe', 'dll', 'so', 'dylib', 'bin', 'pyc',
              'map', 'log'
            ];
            if (ignoredExtensions.includes(ext)) return false;

            const ignoredExactFiles = [
              'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',
              'tsconfig.tsbuildinfo', '.eslintcache', '.env', '.env.local',
              '.env.production', '.env.development', '.ds_store', 'thumbs.db'
            ];
            if (ignoredExactFiles.includes(fileName)) return false;

            if (fileName.includes('.min.js') || fileName.includes('.min.css')) return false;

            const allowedExtensions = [
              'ts', 'tsx', 'js', 'jsx', 'py', 'go', 'md', 'json',
              'txt', 'rs', 'html', 'css', 'yml', 'yaml', 'graphql', 'gql', 'sql'
            ];

            return allowedExtensions.includes(ext);
          });

          if (validFiles.length === 0) {
            console.log(`ℹ️ В проекте ${projectName} нет подходящих для RAG файлов.`);
            continue;
          }

          const allProjectChunks: any[] = [];

          for (const file of validFiles) {
            try {
              const { data: blobData } = await this.octokit.rest.git.getBlob({
                owner,
                repo: projectName,
                file_sha: file.sha!,
              });

              const content = Buffer.from(blobData.content, 'base64').toString('utf-8');
              const language = this.getLanguageFromExtension(file.path!);

              let fileChunks = [];

              if (language) {
                const codeSplitter = RecursiveCharacterTextSplitter.fromLanguage(language, {
                  chunkSize: 1000,
                  chunkOverlap: 100,
                });

                fileChunks = await codeSplitter.createDocuments(
                  [content],
                  [{ project: projectName, file: file.path! }]
                );
              } else {
                const textSplitter = new RecursiveCharacterTextSplitter({
                  chunkSize: 1500,
                  chunkOverlap: 150,
                });
                fileChunks = await textSplitter.createDocuments(
                  [content],
                  [{ project: projectName, file: file.path! }]
                );
              }

              allProjectChunks.push(...fileChunks);
            } catch (fileError: any) {
              console.error(`❌ Ошибка загрузки файла ${file.path}:`, fileError.message);
            }
          }

          console.log(`✂️ Репозиторий ${projectName} разбит на ${allProjectChunks.length} чанков. Сверка изменений...`);

          const activeChunkIds: string[] = [];

          for (let i = 0; i < allProjectChunks.length; i++) {
            const chunk = allProjectChunks[i];
            const currentFile = chunk.metadata.file;
            const currentHash = this.generateHash(chunk.pageContent);

            const existingDoc = await this.gitDocModel.findOne({
              projectName: projectName,
              title: currentFile,
              'metadata.chunkHash': currentHash
            }).exec();

            if (existingDoc) {
              activeChunkIds.push((existingDoc._id as any).toString());
              continue;
            }

            console.log(`[Чанк ${i + 1}/${allProjectChunks.length}] 🧬 Векторизация изменений: ${currentFile}`);

            try {
              const contentsForEmbed = `#TITLE:${currentFile}\n\n#SECTION: git_projects\n\n---\n\n${chunk.pageContent}`;
              const vector = await this.embeddingService.embed(contentsForEmbed);

              const savedDoc = await this.gitDocModel.findOneAndUpdate(
                {
                  projectName: projectName,
                  title: currentFile,
                  content: chunk.pageContent
                },
                {
                  projectName: projectName,
                  title: currentFile,
                  content: chunk.pageContent,
                  embedding: vector,
                  metadata: {
                    filePath: currentFile,
                    branch: 'main',
                    chunkHash: currentHash
                  }
                },
                { upsert: true, returnDocument: 'after' }
              );

              activeChunkIds.push((savedDoc._id as any).toString());

              if (i < allProjectChunks.length - 1) {
                await this.delay(500);
              }
            } catch (chunkError: any) {
              console.error(`❌ Ошибка Gemini/Mongo на чанке ${i + 1} (${currentFile}):`, chunkError.message);
              await this.delay(500);
            }
          }

          const deleteResult = await this.gitDocModel.deleteMany({
            projectName: projectName,
            _id: { $nin: activeChunkIds }
          });

          if (deleteResult.deletedCount > 0) {
            console.log(`🧹 Чистка: Удалено ${deleteResult.deletedCount} устаревших чанков для проекта ${projectName}.`);
          }

          console.log(`✅ Проект ${projectName} полностью синхронизирован с базой!`);

        } catch (repoError: any) {
          console.error(`❌ Ошибка при обработке репозитория ${projectName}: ${repoError.message}. Проект пропущен.`);
        }
      }
    } catch (error: any) {
      console.error('❌ Критическая ошибка получения списка репозиториев:', error.message);
    }
  }
}
