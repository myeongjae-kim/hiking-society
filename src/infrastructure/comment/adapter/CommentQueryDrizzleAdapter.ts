import { and, asc, eq, isNull } from "drizzle-orm";
import type { ArticleId } from "@/core/article/domain";
import type { CommentQueryPort } from "@/core/comment/application/port/out/CommentQueryPort";
import type { Comment, CommentId } from "@/core/comment/domain";
import type { DrizzleTransactionRunner } from "#/infrastructure/common/adapter/DrizzleTransactionRunner";
import { toIsoDateTime, type AuthorName } from "@/core/common/domain";
import { applicationError } from "@/core/common/application/ApplicationError";
import { Autowired } from "@/core/config/Autowired";
import {
	articleTable,
	commentLikeTable,
	commentTable,
	userTable,
} from "@/drizzle/schema";

function toNumericId(id: string) {
	const numericId = Number(id);

	if (!Number.isInteger(numericId) || numericId <= 0) {
		throw applicationError.badRequest("잘못된 id입니다.");
	}

	return numericId;
}

function toAuthorName(row: {
	displayName: string | null;
	email: string | null;
	name: string | null;
}) {
	return (row.displayName ?? row.name ?? row.email ?? "회원") as AuthorName;
}

function incrementCount(counts: Map<number, number>, id: number) {
	counts.set(id, (counts.get(id) ?? 0) + 1);
}

export class CommentQueryDrizzleAdapter implements CommentQueryPort {
	constructor(
		@Autowired("DrizzleTransactionRunner")
		private transactionRunner: DrizzleTransactionRunner,
	) {}

	async listArticleComments(
		input: Parameters<CommentQueryPort["listArticleComments"]>[0],
	) {
		return this.transactionRunner.read(async (tx) => {
			const articleId = toNumericId(input.articleId);
			const commentRows = await tx
				.select({
					articleId: commentTable.articleId,
					authorUserId: commentTable.authorUserId,
					body: commentTable.body,
					createdAt: commentTable.createdAt,
					deletedAt: commentTable.deletedAt,
					displayName: userTable.displayName,
					email: userTable.email,
					id: commentTable.id,
					name: userTable.name,
					parentCommentId: commentTable.parentCommentId,
					profileImageUrl: userTable.profileImageUrl,
					updatedAt: commentTable.updatedAt,
				})
				.from(commentTable)
				.innerJoin(articleTable, eq(articleTable.id, commentTable.articleId))
				.innerJoin(userTable, eq(userTable.id, commentTable.authorUserId))
				.where(
					and(
						eq(commentTable.articleId, articleId),
						isNull(articleTable.deletedAt),
						isNull(userTable.deletedAt),
					),
				)
				.orderBy(asc(commentTable.createdAt));
			const commentLikeRows = await tx
				.select({
					commentId: commentLikeTable.commentId,
					userId: commentLikeTable.userId,
				})
				.from(commentLikeTable)
				.innerJoin(
					commentTable,
					eq(commentTable.id, commentLikeTable.commentId),
				)
				.innerJoin(articleTable, eq(articleTable.id, commentTable.articleId))
				.innerJoin(userTable, eq(userTable.id, commentLikeTable.userId))
				.where(
					and(
						eq(commentTable.articleId, articleId),
						isNull(commentTable.deletedAt),
						isNull(articleTable.deletedAt),
						isNull(userTable.deletedAt),
					),
				);

			const commentLikeCountByCommentId = new Map<number, number>();
			const likedCommentIdsByCurrentUser = new Set<number>();

			for (const like of commentLikeRows) {
				incrementCount(commentLikeCountByCommentId, like.commentId);

				if (like.userId === input.currentUserId) {
					likedCommentIdsByCurrentUser.add(like.commentId);
				}
			}

			return commentRows.map((row) => ({
				articleId: String(row.articleId) as ArticleId,
				authorName: toAuthorName(row),
				authorProfileImageUrl: row.profileImageUrl,
				authorUserId: row.authorUserId,
				body: row.body,
				createdAt: toIsoDateTime(row.createdAt),
				deletedAt: toIsoDateTime(row.deletedAt),
				id: String(row.id) as CommentId,
				likeCount: commentLikeCountByCommentId.get(row.id) ?? 0,
				likedByCurrentUser: likedCommentIdsByCurrentUser.has(row.id),
				parentCommentId:
					row.parentCommentId === null
						? null
						: (String(row.parentCommentId) as CommentId),
				updatedAt: toIsoDateTime(row.updatedAt),
			})) as Comment[];
		});
	}
}
