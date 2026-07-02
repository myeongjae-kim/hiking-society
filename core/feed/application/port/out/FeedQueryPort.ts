import type { FeedSnapshot } from '@/core/feed/model/FeedSnapshot';

export interface FeedQueryPort {
  list(): Promise<FeedSnapshot>;
}
