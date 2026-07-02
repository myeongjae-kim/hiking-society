import { Autowired } from '@/core/config/Autowired';
import type { HikingCommandUseCase } from './port/in/HikingCommandUseCase';
import type { FeedCommandPort } from '@/core/feed/application/port/out/FeedCommandPort';

export class HikingCommandService implements HikingCommandUseCase {
  constructor(
    @Autowired('FeedCommandPort')
    private feedCommandPort: FeedCommandPort,
  ) {}

  async create(input: Parameters<HikingCommandUseCase['create']>[0]) {
    await this.feedCommandPort.createHiking(input);
  }

  async update(input: Parameters<HikingCommandUseCase['update']>[0]) {
    await this.feedCommandPort.updateHiking(input);
  }

  async delete(input: Parameters<HikingCommandUseCase['delete']>[0]) {
    await this.feedCommandPort.deleteHiking(input);
  }
}
