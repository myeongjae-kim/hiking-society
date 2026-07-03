import type { FeedSnapshot } from '@/core/feed/model/FeedSnapshot';

export interface ListFeedUseCase {
  list(input: { currentUserId: number }): Promise<FeedSnapshot>;
}
