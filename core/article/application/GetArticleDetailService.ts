import { Autowired } from '@/core/config/Autowired';
import type { GetArticleDetailUseCase } from './port/in/GetArticleDetailUseCase';
import type { ArticleDetailQueryPort } from './port/out/ArticleDetailQueryPort';

export class GetArticleDetailService implements GetArticleDetailUseCase {
  constructor(
    @Autowired('ArticleDetailQueryPort')
    private articleDetailQueryPort: ArticleDetailQueryPort,
  ) {}

  async get(input: Parameters<GetArticleDetailUseCase['get']>[0]) {
    return this.articleDetailQueryPort.get(input);
  }
}
