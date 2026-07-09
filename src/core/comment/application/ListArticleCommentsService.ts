import { Autowired } from "@/core/config/Autowired";
import type { ListArticleCommentsUseCase } from "./port/in/ListArticleCommentsUseCase";
import type { CommentQueryPort } from "./port/out/CommentQueryPort";

export class ListArticleCommentsService implements ListArticleCommentsUseCase {
	constructor(
		@Autowired("CommentQueryPort")
		private commentQueryPort: CommentQueryPort,
	) {}

	async listArticleComments(
		input: Parameters<ListArticleCommentsUseCase["listArticleComments"]>[0],
	) {
		return this.commentQueryPort.listArticleComments(input);
	}
}
