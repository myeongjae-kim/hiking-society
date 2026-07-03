import { Autowired } from '@/core/config/Autowired';
import type { ArticleCommandUseCase, ArticleMediaUpload } from './port/in/ArticleCommandUseCase';
import type { MediaStoragePort } from './port/out/MediaStoragePort';
import type { FeedCommandPort } from '@/core/feed/application/port/out/FeedCommandPort';

function isUpload(media: unknown): media is ArticleMediaUpload {
  return (
    typeof media === 'object' &&
    media !== null &&
    'bytes' in media &&
    media.bytes instanceof Uint8Array
  );
}

export class ArticleCommandService implements ArticleCommandUseCase {
  constructor(
    @Autowired('FeedCommandPort')
    private feedCommandPort: FeedCommandPort,
    @Autowired('MediaStoragePort')
    private mediaStoragePort: MediaStoragePort,
  ) {}

  async create(input: Parameters<ArticleCommandUseCase['create']>[0]) {
    const storedMedia = await Promise.all(
      input.media.map((media) => this.mediaStoragePort.upload(media)),
    );

    await this.feedCommandPort.createArticle({
      ...input,
      storedMedia,
    });
  }

  async update(input: Parameters<ArticleCommandUseCase['update']>[0]) {
    const storedMedia = await Promise.all(
      input.media.map((media) => (isUpload(media) ? this.mediaStoragePort.upload(media) : media)),
    );

    await this.feedCommandPort.updateArticle({
      articleId: input.articleId,
      storedMedia,
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
