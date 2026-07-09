import type { TransactionPort } from "@/core/common/application/port/out/TransactionPort";
import { Autowired } from "@/core/config/Autowired";
import type { ListArticleCommentsUseCase } from "./port/in/ListArticleCommentsUseCase";
import type { CommentQueryPort } from "./port/out/CommentQueryPort";

export class ListArticleCommentsService implements ListArticleCommentsUseCase {
	constructor(
		@Autowired("CommentQueryPort")
		private commentQueryPort: CommentQueryPort,
		@Autowired("TransactionPort")
		private transactionPort: TransactionPort,
	) {}

	async listArticleComments(
		input: Parameters<ListArticleCommentsUseCase["listArticleComments"]>[0],
	) {
		return this.transactionPort.run(() =>
			this.commentQueryPort.listArticleComments(input),
		);
	}
}
