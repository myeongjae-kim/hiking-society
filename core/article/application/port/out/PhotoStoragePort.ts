import type { ArticlePhotoUpload } from '@/core/article/application/port/in/ArticleCommandUseCase';
import type { StoredArticlePhoto } from '@/core/feed/application/port/out/FeedCommandPort';

export interface PhotoStoragePort {
  upload(input: ArticlePhotoUpload): Promise<StoredArticlePhoto>;
}
