import { applicationError } from "@/core/common/application/ApplicationError";
import type { ClockPort } from "@/core/common/application/port/out/ClockPort";
import type { TransactionPort } from "@/core/common/application/port/out/TransactionPort";
import { Autowired } from "@/core/config/Autowired";
import type { CreateNotificationsUseCase } from "@/core/notification/application/port/in/CreateNotificationsUseCase";
import {
	COMMENT_BODY_REQUIRED_MESSAGE,
	CommentBody,
	CommentEntity,
} from "../domain";
import type { CommentCommandUseCase } from "./port/in/CommentCommandUseCase";
import type { CommentCommandPort } from "./port/out/CommentCommandPort";

export class CommentCommandService implements CommentCommandUseCase {
	constructor(
		@Autowired("CommentCommandPort")
		private commentCommandPort: CommentCommandPort,
		@Autowired("CreateNotificationsUseCase")
		private createNotificationsUseCase: CreateNotificationsUseCase,
		@Autowired("TransactionPort")
		private transactionPort: TransactionPort,
		@Autowired("ClockPort")
		private clockPort: ClockPort,
	) {}

	private requireCommentBody(body: string) {
		const commentBody = CommentBody.from(body);

		if (!commentBody) {
			throw applicationError.badRequest(COMMENT_BODY_REQUIRED_MESSAGE);
		}

		return commentBody;
	}

	async create(input: Parameters<CommentCommandUseCase["create"]>[0]) {
		await this.transactionPort.run(
			async () => {
				const body = this.requireCommentBody(input.body);
				const article = await this.commentCommandPort.findActiveArticleById(
					input.articleId,
				);

				if (!article) {
					throw applicationError.notFound(
						"댓글을 작성할 글을 찾을 수 없습니다.",
					);
				}

				const parentCommentId =
					"parentCommentId" in input ? input.parentCommentId : null;
				const parent = parentCommentId
					? await this.commentCommandPort.findCommentById(parentCommentId)
					: null;
				const replyPlan = parent
					? CommentEntity.rehydrate(parent).planReplyFor(input.articleId)
					: null;

				if (parentCommentId !== null && !replyPlan) {
					throw applicationError.notFound(
						"답글을 작성할 댓글을 찾을 수 없습니다.",
					);
				}

				const commentId = await this.commentCommandPort.create({
					articleId: input.articleId,
					authorUserId: input.authorUserId,
					body: body.toString(),
					parentCommentId,
				});

				await this.createNotificationsUseCase.createComment({
					actorUserId: input.authorUserId,
					articleAuthorUserId: article.authorUserId,
					articleId: input.articleId,
					commentBody: body.toString(),
					commentId,
					parentCommentAuthorUserId:
						replyPlan?.parentCommentAuthorUserId ?? null,
					parentCommentId: replyPlan?.parentCommentId ?? null,
				});
			},
			{ readOnly: false },
		);
	}

	async update(input: Parameters<CommentCommandUseCase["update"]>[0]) {
		await this.transactionPort.run(
			async () => {
				const body = this.requireCommentBody(input.values.body ?? "");

				const comment = await this.commentCommandPort.findCommentById(
					input.commentId,
				);

				const updatePlan = comment
					? CommentEntity.rehydrate(comment).planUpdate({
							body,
							userId: input.userId,
						})
					: null;

				if (!updatePlan) {
					throw applicationError.notFound(
						"댓글을 수정할 권한이 없거나 댓글을 찾을 수 없습니다.",
					);
				}

				const updated = await this.commentCommandPort.update({
					body: updatePlan.body,
					commentId: updatePlan.commentId,
					now: this.clockPort.now(),
				});

				if (!updated) {
					throw applicationError.notFound(
						"댓글을 수정할 권한이 없거나 댓글을 찾을 수 없습니다.",
					);
				}
			},
			{ readOnly: false },
		);
	}

	async delete(input: Parameters<CommentCommandUseCase["delete"]>[0]) {
		await this.transactionPort.run(
			async () => {
				const deletedBody = this.requireCommentBody("삭제된 댓글");
				const comment = await this.commentCommandPort.findCommentById(
					input.commentId,
				);

				const deletePlan = comment
					? CommentEntity.rehydrate(comment).planDelete({
							deletedBody,
							userId: input.userId,
						})
					: null;

				if (!deletePlan) {
					throw applicationError.notFound(
						"댓글을 삭제할 권한이 없거나 댓글을 찾을 수 없습니다.",
					);
				}

				const deleted = await this.commentCommandPort.delete({
					body: deletePlan.body,
					commentId: deletePlan.commentId,
					now: this.clockPort.now(),
				});

				if (!deleted) {
					throw applicationError.notFound(
						"댓글을 삭제할 권한이 없거나 댓글을 찾을 수 없습니다.",
					);
				}
			},
			{ readOnly: false },
		);
	}
}
