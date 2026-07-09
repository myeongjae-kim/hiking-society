import { and, eq, isNull } from "drizzle-orm";
import type { ArticleId } from "@/core/article/domain";
import type { CommentId } from "@/core/comment/domain";
import { db } from "@/core/config/drizzle.server";
import {
	articleLikeTable,
	articleTable,
	commentLikeTable,
	commentTable,
} from "@/drizzle/schema";
import type { LikeCommandPort } from "../application/port/out/LikeCommandPort";

function toNumericId(id: string) {
	const numericId = Number(id);

	if (!Number.isInteger(numericId) || numericId <= 0) {
		throw new Error("잘못된 id입니다.");
	}

	return numericId;
}

export class LikeDrizzleAdapter implements LikeCommandPort {
	async toggleArticleLike(
		input: Parameters<LikeCommandPort["toggleArticleLike"]>[0],
	) {
		const articleId = toNumericId(input.articleId);

		return db.transaction(async (tx) => {
			const [article] = await tx
				.select({
					authorUserId: articleTable.authorUserId,
					body: articleTable.body,
					id: articleTable.id,
				})
				.from(articleTable)
				.where(
					and(eq(articleTable.id, articleId), isNull(articleTable.deletedAt)),
				)
				.limit(1);

			if (!article) {
				return null;
			}

			const [existingLike] = await tx
				.select({ id: articleLikeTable.id })
				.from(articleLikeTable)
				.where(
					and(
						eq(articleLikeTable.articleId, articleId),
						eq(articleLikeTable.userId, input.userId),
					),
				)
				.limit(1);

			if (existingLike) {
				await tx
					.delete(articleLikeTable)
					.where(eq(articleLikeTable.id, existingLike.id));
				return {
					articleAuthorUserId: article.authorUserId,
					articleBody: article.body,
					articleId: String(article.id) as ArticleId,
					liked: false,
				};
			}

			await tx
				.insert(articleLikeTable)
				.values({ articleId, userId: input.userId });

			return {
				articleAuthorUserId: article.authorUserId,
				articleBody: article.body,
				articleId: String(article.id) as ArticleId,
				liked: true,
			};
		});
	}

	async toggleCommentLike(
		input: Parameters<LikeCommandPort["toggleCommentLike"]>[0],
	) {
		const commentId = toNumericId(input.commentId);

		return db.transaction(async (tx) => {
			const [comment] = await tx
				.select({
					articleId: commentTable.articleId,
					authorUserId: commentTable.authorUserId,
					body: commentTable.body,
					id: commentTable.id,
				})
				.from(commentTable)
				.innerJoin(articleTable, eq(articleTable.id, commentTable.articleId))
				.where(
					and(
						eq(commentTable.id, commentId),
						isNull(commentTable.deletedAt),
						isNull(articleTable.deletedAt),
					),
				)
				.limit(1);

			if (!comment) {
				return null;
			}

			const [existingLike] = await tx
				.select({ id: commentLikeTable.id })
				.from(commentLikeTable)
				.where(
					and(
						eq(commentLikeTable.commentId, commentId),
						eq(commentLikeTable.userId, input.userId),
					),
				)
				.limit(1);

			if (existingLike) {
				await tx
					.delete(commentLikeTable)
					.where(eq(commentLikeTable.id, existingLike.id));
				return {
					articleId: String(comment.articleId) as ArticleId,
					commentAuthorUserId: comment.authorUserId,
					commentBody: comment.body,
					commentId: String(comment.id) as CommentId,
					liked: false,
				};
			}

			await tx
				.insert(commentLikeTable)
				.values({ commentId, userId: input.userId });

			return {
				articleId: String(comment.articleId) as ArticleId,
				commentAuthorUserId: comment.authorUserId,
				commentBody: comment.body,
				commentId: String(comment.id) as CommentId,
				liked: true,
			};
		});
	}
}
