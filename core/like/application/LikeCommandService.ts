import { Autowired } from '@/core/config/Autowired';
import type { LikeCommandUseCase } from './port/in/LikeCommandUseCase';
import type { LikeCommandPort } from './port/out/LikeCommandPort';

export class LikeCommandService implements LikeCommandUseCase {
  constructor(
    @Autowired('LikeCommandPort')
    private likeCommandPort: LikeCommandPort,
  ) {}

  async toggleArticleLike(input: Parameters<LikeCommandUseCase['toggleArticleLike']>[0]) {
    await this.likeCommandPort.toggleArticleLike(input);
  }

  async toggleCommentLike(input: Parameters<LikeCommandUseCase['toggleCommentLike']>[0]) {
    await this.likeCommandPort.toggleCommentLike(input);
  }
}
