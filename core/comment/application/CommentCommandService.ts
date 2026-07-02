import { Autowired } from '@/core/config/Autowired';
import type { FeedCommandPort } from '@/core/feed/application/port/out/FeedCommandPort';
import type { CommentCommandUseCase } from './port/in/CommentCommandUseCase';

export class CommentCommandService implements CommentCommandUseCase {
  constructor(
    @Autowired('FeedCommandPort')
    private feedCommandPort: FeedCommandPort,
  ) {}

  async create(input: Parameters<CommentCommandUseCase['create']>[0]) {
    await this.feedCommandPort.createComment(input);
  }

  async update(input: Parameters<CommentCommandUseCase['update']>[0]) {
    await this.feedCommandPort.updateComment(input);
  }

  async delete(input: Parameters<CommentCommandUseCase['delete']>[0]) {
    await this.feedCommandPort.deleteComment(input);
  }
}
