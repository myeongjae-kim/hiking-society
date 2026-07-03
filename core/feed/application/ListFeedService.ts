import { Autowired } from '@/core/config/Autowired';
import type { ListFeedUseCase } from './port/in/ListFeedUseCase';
import type { FeedQueryPort } from './port/out/FeedQueryPort';

export class ListFeedService implements ListFeedUseCase {
  constructor(
    @Autowired('FeedQueryPort')
    private feedQueryPort: FeedQueryPort,
  ) {}

  async list(input: Parameters<ListFeedUseCase['list']>[0]) {
    return this.feedQueryPort.list(input);
  }
}
