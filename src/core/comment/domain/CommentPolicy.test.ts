import { describe, expect, it } from "vitest";
import type { ArticleId } from "@/core/article/domain";
import { CommentEntity } from "@/core/comment/domain";
import type { CommentId } from "@/core/comment/domain/Comment";

const articleId = "1" as ArticleId;
const otherArticleId = "2" as ArticleId;
const commentId = "10" as CommentId;

describe("CommentEntity reply target", () => {
	it("allows replies only to active top-level comments in the same article", () => {
		expect(
			CommentEntity.rehydrate({
				articleId,
				authorUserId: 1,
				deleted: false,
				parentCommentId: null,
			}).canReceiveReplyFor(articleId),
		).toBe(true);

		expect(
			CommentEntity.rehydrate({
				articleId: otherArticleId,
				authorUserId: 1,
				deleted: false,
				parentCommentId: null,
			}).canReceiveReplyFor(articleId),
		).toBe(false);

		expect(
			CommentEntity.rehydrate({
				articleId,
				authorUserId: 1,
				deleted: true,
				parentCommentId: null,
			}).canReceiveReplyFor(articleId),
		).toBe(false);

		expect(
			CommentEntity.rehydrate({
				articleId,
				authorUserId: 1,
				deleted: false,
				parentCommentId: commentId,
			}).canReceiveReplyFor(articleId),
		).toBe(false);
	});
});

describe("CommentEntity ownership", () => {
	it("allows only the comment author to manage the comment", () => {
		const comment = CommentEntity.rehydrate({
			articleId,
			authorUserId: 1,
			deleted: false,
			parentCommentId: null,
		});

		expect(comment.canBeManagedBy(1)).toBe(true);
		expect(comment.canBeManagedBy(2)).toBe(false);
	});
});
