import type { ArticleMediaUpload } from '@/core/article/application/port/in/ArticleCommandUseCase';
import type { StoredArticleMedia } from '@/core/feed/application/port/out/FeedCommandPort';

export interface MediaStoragePort {
  upload(input: ArticleMediaUpload): Promise<StoredArticleMedia>;
}
