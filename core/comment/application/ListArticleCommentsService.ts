import { Autowired } from '@/core/config/Autowired';
import type { CommentQueryPort } from './port/out/CommentQueryPort';
import type { ListArticleCommentsUseCase } from './port/in/ListArticleCommentsUseCase';

export class ListArticleCommentsService implements ListArticleCommentsUseCase {
  constructor(
    @Autowired('CommentQueryPort')
    private commentQueryPort: CommentQueryPort,
  ) {}

  async listArticleComments(
    input: Parameters<ListArticleCommentsUseCase['listArticleComments']>[0],
  ) {
    return this.commentQueryPort.listArticleComments(input);
  }
}
