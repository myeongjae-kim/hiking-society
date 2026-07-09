import { applicationError } from "@/core/common/application/ApplicationError";
import { Autowired } from "@/core/config/Autowired";
import type { NotificationCommandPort } from "@/core/notification/application/port/out/NotificationCommandPort";
import { createCommentNotifications } from "@/core/notification/model/NotificationFactory";
import { CommentOwnership, CommentReplyTarget } from "../domain";
import type { CommentCommandUseCase } from "./port/in/CommentCommandUseCase";
import type { CommentCommandPort } from "./port/out/CommentCommandPort";

export class CommentCommandService implements CommentCommandUseCase {
	constructor(
		@Autowired("CommentCommandPort")
		private commentCommandPort: CommentCommandPort,
		@Autowired("NotificationCommandPort")
		private notificationCommandPort: NotificationCommandPort,
	) {}

	async create(input: Parameters<CommentCommandUseCase["create"]>[0]) {
		const article = await this.commentCommandPort.findActiveArticleById(
			input.articleId,
		);

		if (!article) {
			throw applicationError.notFound("댓글을 작성할 글을 찾을 수 없습니다.");
		}

		const parentCommentId =
			"parentCommentId" in input ? input.parentCommentId : null;
		const parent = parentCommentId
			? await this.commentCommandPort.findCommentById(parentCommentId)
			: null;

		if (
			parentCommentId !== null &&
			!CommentReplyTarget.of(parent).canReceiveReplyFor(input.articleId)
		) {
			throw applicationError.notFound("답글을 작성할 댓글을 찾을 수 없습니다.");
		}

		const commentId = await this.commentCommandPort.create({
			articleId: input.articleId,
			authorUserId: input.authorUserId,
			body: input.body,
			parentCommentId,
		});

		await this.notificationCommandPort.createMany({
			notifications: createCommentNotifications({
				actorUserId: input.authorUserId,
				articleAuthorUserId: article.authorUserId,
				articleId: input.articleId,
				commentBody: input.body,
				commentId,
				parentCommentAuthorUserId: parent?.authorUserId ?? null,
				parentCommentId,
			}),
		});
	}

	async update(input: Parameters<CommentCommandUseCase["update"]>[0]) {
		if (!input.values.body) {
			throw applicationError.badRequest("댓글 내용을 입력해주세요.");
		}

		const comment = await this.commentCommandPort.findCommentById(
			input.commentId,
		);

		if (
			!comment ||
			!CommentOwnership.of(comment).canBeManagedBy(input.userId)
		) {
			throw applicationError.notFound(
				"댓글을 수정할 권한이 없거나 댓글을 찾을 수 없습니다.",
			);
		}

		const updated = await this.commentCommandPort.update({
			body: input.values.body,
			commentId: input.commentId,
			now: new Date(),
		});

		if (!updated) {
			throw applicationError.notFound(
				"댓글을 수정할 권한이 없거나 댓글을 찾을 수 없습니다.",
			);
		}
	}

	async delete(input: Parameters<CommentCommandUseCase["delete"]>[0]) {
		const comment = await this.commentCommandPort.findCommentById(
			input.commentId,
		);

		if (
			!comment ||
			!CommentOwnership.of(comment).canBeManagedBy(input.userId)
		) {
			throw applicationError.notFound(
				"댓글을 삭제할 권한이 없거나 댓글을 찾을 수 없습니다.",
			);
		}

		const deleted = await this.commentCommandPort.delete({
			body: "삭제된 댓글",
			commentId: input.commentId,
			now: new Date(),
		});

		if (!deleted) {
			throw applicationError.notFound(
				"댓글을 삭제할 권한이 없거나 댓글을 찾을 수 없습니다.",
			);
		}
	}
}
