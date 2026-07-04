import { Autowired } from '@/core/config/Autowired';
import type { ListFeedUseCase } from './port/in/ListFeedUseCase';
import type { FeedQueryPort } from './port/out/FeedQueryPort';

export class ListFeedService implements ListFeedUseCase {
  constructor(
    @Autowired('FeedQueryPort')
    private feedQueryPort: FeedQueryPort,
  ) {}

  async listHikings(input: Parameters<ListFeedUseCase['listHikings']>[0]) {
    return this.feedQueryPort.listHikings(input);
  }

  async listHikingArticles(input: Parameters<ListFeedUseCase['listHikingArticles']>[0]) {
    return this.feedQueryPort.listHikingArticles(input);
  }
}
