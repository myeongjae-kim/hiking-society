import { and, eq, isNull } from "drizzle-orm";
import type { ArticleId } from "@/core/article/domain";
import type { CommentCommandPort } from "@/core/comment/application/port/out/CommentCommandPort";
import type { CommentId } from "@/core/comment/domain";
import type { DrizzleTransactionRunner } from "#/infrastructure/common/adapter/DrizzleTransactionRunner";
import { applicationError } from "@/core/common/application/ApplicationError";
import { Autowired } from "@/core/config/Autowired";
import { articleTable, commentTable } from "@/drizzle/schema";

function toNumericId(id: string) {
	const numericId = Number(id);

	if (!Number.isInteger(numericId) || numericId <= 0) {
		throw applicationError.badRequest("잘못된 id입니다.");
	}

	return numericId;
}

export class CommentCommandDrizzleAdapter implements CommentCommandPort {
	constructor(
		@Autowired("DrizzleTransactionRunner")
		private transactionRunner: DrizzleTransactionRunner,
	) {}

	async create(input: Parameters<CommentCommandPort["create"]>[0]) {
		return this.transactionRunner.write(async (tx) => {
			const [comment] = await tx
				.insert(commentTable)
				.values({
					articleId: toNumericId(input.articleId),
					authorUserId: input.authorUserId,
					body: input.body,
					parentCommentId: input.parentCommentId
						? toNumericId(input.parentCommentId)
						: null,
				})
				.returning({ id: commentTable.id });

			if (!comment) {
				throw applicationError.internal("댓글을 저장하지 못했습니다.");
			}

			return String(comment.id) as CommentId;
		});
	}

	async delete(input: Parameters<CommentCommandPort["delete"]>[0]) {
		return this.transactionRunner.write(async (tx) => {
			const [updated] = await tx
				.update(commentTable)
				.set({ body: input.body, deletedAt: input.now, updatedAt: input.now })
				.where(eq(commentTable.id, toNumericId(input.commentId)))
				.returning({ id: commentTable.id });

			return Boolean(updated);
		});
	}

	async findActiveArticleById(articleId: ArticleId) {
		return this.transactionRunner.read(async (tx) => {
			const [article] = await tx
				.select({
					authorUserId: articleTable.authorUserId,
					body: articleTable.body,
					id: articleTable.id,
				})
				.from(articleTable)
				.where(
					and(
						eq(articleTable.id, toNumericId(articleId)),
						isNull(articleTable.deletedAt),
					),
				)
				.limit(1);

			if (!article) {
				return null;
			}

			return {
				authorUserId: article.authorUserId,
				body: article.body,
				id: String(article.id) as ArticleId,
			};
		});
	}

	async findCommentById(commentId: CommentId) {
		return this.transactionRunner.read(async (tx) => {
			const [comment] = await tx
				.select({
					articleId: commentTable.articleId,
					authorUserId: commentTable.authorUserId,
					body: commentTable.body,
					deletedAt: commentTable.deletedAt,
					id: commentTable.id,
					parentCommentId: commentTable.parentCommentId,
				})
				.from(commentTable)
				.where(eq(commentTable.id, toNumericId(commentId)))
				.limit(1);

			if (!comment) {
				return null;
			}

			return {
				articleId: String(comment.articleId) as ArticleId,
				authorUserId: comment.authorUserId,
				body: comment.body,
				deleted: comment.deletedAt !== null,
				id: String(comment.id) as CommentId,
				parentCommentId:
					comment.parentCommentId === null
						? null
						: (String(comment.parentCommentId) as CommentId),
			};
		});
	}

	async update(input: Parameters<CommentCommandPort["update"]>[0]) {
		return this.transactionRunner.write(async (tx) => {
			const [updated] = await tx
				.update(commentTable)
				.set({ body: input.body, updatedAt: input.now })
				.where(eq(commentTable.id, toNumericId(input.commentId)))
				.returning({ id: commentTable.id });

			return Boolean(updated);
		});
	}
}
