import { applicationError } from "@/core/common/application/ApplicationError";
import type { TransactionPort } from "@/core/common/application/port/out/TransactionPort";
import { Autowired } from "@/core/config/Autowired";
import type { CreateNotificationsUseCase } from "@/core/notification/application/port/in/CreateNotificationsUseCase";
import type { LikeCommandUseCase } from "./port/in/LikeCommandUseCase";
import type { LikeCommandPort } from "./port/out/LikeCommandPort";

export class LikeCommandService implements LikeCommandUseCase {
	constructor(
		@Autowired("LikeCommandPort")
		private likeCommandPort: LikeCommandPort,
		@Autowired("CreateNotificationsUseCase")
		private createNotificationsUseCase: CreateNotificationsUseCase,
		@Autowired("TransactionPort")
		private transactionPort: TransactionPort,
	) {}

	async toggleArticleLike(
		input: Parameters<LikeCommandUseCase["toggleArticleLike"]>[0],
	) {
		await this.transactionPort.run(
			async () => {
				const result = await this.likeCommandPort.toggleArticleLike(input);

				if (!result) {
					throw applicationError.notFound("좋아요할 글을 찾을 수 없습니다.");
				}

				if (!result.liked) {
					return;
				}

				await this.createNotificationsUseCase.createArticleLike({
					actorUserId: input.userId,
					articleAuthorUserId: result.articleAuthorUserId,
					articleBody: result.articleBody,
					articleId: result.articleId,
				});
			},
			{ readOnly: false },
		);
	}

	async toggleCommentLike(
		input: Parameters<LikeCommandUseCase["toggleCommentLike"]>[0],
	) {
		await this.transactionPort.run(
			async () => {
				const result = await this.likeCommandPort.toggleCommentLike(input);

				if (!result) {
					throw applicationError.notFound("좋아요할 댓글을 찾을 수 없습니다.");
				}

				if (!result.liked) {
					return;
				}

				await this.createNotificationsUseCase.createCommentLike({
					actorUserId: input.userId,
					articleId: result.articleId,
					commentAuthorUserId: result.commentAuthorUserId,
					commentBody: result.commentBody,
					commentId: result.commentId,
				});
			},
			{ readOnly: false },
		);
	}
}
