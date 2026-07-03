import type { Article } from '@/core/article/domain';
import type { Comment } from '@/core/comment/domain';

export type ArticleDetailSnapshot = {
  readonly article: Article;
  readonly comments: readonly Comment[];
};
