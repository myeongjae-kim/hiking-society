import type { ArticleId, CreateArticleInput } from '@/core/article/domain';
import type {
  ArticleMediaUpload,
  ExistingArticleMediaInput,
} from '@/core/article/model/ArticleMediaCommand';

export interface ArticleCommandUseCase {
  create(
    input: Omit<CreateArticleInput, 'media'> & { media: readonly ArticleMediaUpload[] },
  ): Promise<void>;
  update(input: {
    articleId: ArticleId;
    body: string;
    userId: number;
    media: readonly (ArticleMediaUpload | ExistingArticleMediaInput)[];
  }): Promise<void>;
  delete(input: { articleId: ArticleId; userId: number }): Promise<void>;
}
