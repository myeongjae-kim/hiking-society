import type { Article } from '@/core/article/domain';
import type { Comment } from '@/core/comment/domain';
import type { Hiking, HikingId } from '@/core/hiking/domain';

export type FeedSnapshot = {
  readonly articles: readonly Article[];
  readonly comments: readonly Comment[];
  readonly hikings: readonly Hiking[];
};

export type HikingArticleCount = {
  readonly articleCount: number;
  readonly hikingId: HikingId;
};

export type FeedSummarySnapshot = {
  readonly articleCount: number;
  readonly commentCount: number;
  readonly hikingArticleCounts: readonly HikingArticleCount[];
  readonly hikings: readonly Hiking[];
};

export type HikingArticlesSnapshot = {
  readonly articles: readonly Article[];
  readonly comments: readonly Comment[];
};
