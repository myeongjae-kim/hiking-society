import type { FeedSummarySnapshot, HikingArticlesSnapshot } from '@/core/feed/model/FeedSnapshot';
import type { HikingId } from '@/core/hiking/domain';

export interface ListFeedUseCase {
  listHikings(input: { currentUserId: number }): Promise<FeedSummarySnapshot>;
  listHikingArticles(input: {
    currentUserId: number;
    hikingId: HikingId;
  }): Promise<HikingArticlesSnapshot>;
}
