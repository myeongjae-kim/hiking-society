import { Autowired } from '@/core/config/Autowired';
import type { ArticleCommandUseCase } from './port/in/ArticleCommandUseCase';
import type { FeedCommandPort } from '@/core/feed/application/port/out/FeedCommandPort';

export class ArticleCommandService implements ArticleCommandUseCase {
  constructor(
    @Autowired('FeedCommandPort')
    private feedCommandPort: FeedCommandPort,
  ) {}

  async create(input: Parameters<ArticleCommandUseCase['create']>[0]) {
    await this.feedCommandPort.createArticle({
      ...input,
      storedMedia: input.media,
    });
  }

  async update(input: Parameters<ArticleCommandUseCase['update']>[0]) {
    await this.feedCommandPort.updateArticle({
      articleId: input.articleId,
      storedMedia: input.media,
      userId: input.userId,
      values: {
        body: input.body,
      },
    });
  }

  async delete(input: Parameters<ArticleCommandUseCase['delete']>[0]) {
    await this.feedCommandPort.deleteArticle(input);
  }
}
