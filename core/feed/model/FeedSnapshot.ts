import type { Article } from '@/core/article/domain';
import type { Comment } from '@/core/comment/domain';
import type { Hiking } from '@/core/hiking/domain';

export type FeedSnapshot = {
  readonly articles: readonly Article[];
  readonly comments: readonly Comment[];
  readonly hikings: readonly Hiking[];
};
