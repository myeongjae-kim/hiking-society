import { Autowired } from '@/core/config/Autowired';
import type { ArticleCommandUseCase, ArticlePhotoUpload } from './port/in/ArticleCommandUseCase';
import type { PhotoStoragePort } from './port/out/PhotoStoragePort';
import type { FeedCommandPort } from '@/core/feed/application/port/out/FeedCommandPort';

function isUpload(photo: unknown): photo is ArticlePhotoUpload {
  return (
    typeof photo === 'object' &&
    photo !== null &&
    'bytes' in photo &&
    photo.bytes instanceof Uint8Array
  );
}

export class ArticleCommandService implements ArticleCommandUseCase {
  constructor(
    @Autowired('FeedCommandPort')
    private feedCommandPort: FeedCommandPort,
    @Autowired('PhotoStoragePort')
    private photoStoragePort: PhotoStoragePort,
  ) {}

  async create(input: Parameters<ArticleCommandUseCase['create']>[0]) {
    const storedPhotos = await Promise.all(
      input.photos.map((photo) => this.photoStoragePort.upload(photo)),
    );

    await this.feedCommandPort.createArticle({
      ...input,
      storedPhotos,
    });
  }

  async update(input: Parameters<ArticleCommandUseCase['update']>[0]) {
    const storedPhotos = await Promise.all(
      input.photos.map((photo) => (isUpload(photo) ? this.photoStoragePort.upload(photo) : photo)),
    );

    await this.feedCommandPort.updateArticle({
      articleId: input.articleId,
      storedPhotos,
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
