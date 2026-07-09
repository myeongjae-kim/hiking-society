import type { TransactionPort } from "@/core/common/application/port/out/TransactionPort";
import { Autowired } from "@/core/config/Autowired";
import type { GetArticleDetailUseCase } from "./port/in/GetArticleDetailUseCase";
import type { ArticleDetailQueryPort } from "./port/out/ArticleDetailQueryPort";

export class GetArticleDetailService implements GetArticleDetailUseCase {
	constructor(
		@Autowired("ArticleDetailQueryPort")
		private articleDetailQueryPort: ArticleDetailQueryPort,
		@Autowired("TransactionPort")
		private transactionPort: TransactionPort,
	) {}

	async get(input: Parameters<GetArticleDetailUseCase["get"]>[0]) {
		return this.transactionPort.run(() =>
			this.articleDetailQueryPort.get(input),
		);
	}
}
