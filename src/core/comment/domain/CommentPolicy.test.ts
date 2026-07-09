import { describe, expect, it } from "vitest";
import type { ArticleId } from "@/core/article/domain";
import { CommentOwnership, CommentReplyTarget } from "@/core/comment/domain";
import type { CommentId } from "@/core/comment/domain/Comment";

const articleId = "1" as ArticleId;
const otherArticleId = "2" as ArticleId;
const commentId = "10" as CommentId;

describe("CommentReplyTarget", () => {
	it("allows replies only to active top-level comments in the same article", () => {
		expect(
			CommentReplyTarget.of({
				articleId,
				authorUserId: 1,
				deleted: false,
				parentCommentId: null,
			}).canReceiveReplyFor(articleId),
		).toBe(true);

		expect(
			CommentReplyTarget.of({
				articleId: otherArticleId,
				authorUserId: 1,
				deleted: false,
				parentCommentId: null,
			}).canReceiveReplyFor(articleId),
		).toBe(false);

		expect(
			CommentReplyTarget.of({
				articleId,
				authorUserId: 1,
				deleted: true,
				parentCommentId: null,
			}).canReceiveReplyFor(articleId),
		).toBe(false);

		expect(
			CommentReplyTarget.of({
				articleId,
				authorUserId: 1,
				deleted: false,
				parentCommentId: commentId,
			}).canReceiveReplyFor(articleId),
		).toBe(false);
	});

	it("rejects missing reply targets", () => {
		expect(CommentReplyTarget.of(null).canReceiveReplyFor(articleId)).toBe(
			false,
		);
	});
});

describe("CommentOwnership", () => {
	it("allows only the comment author to manage the comment", () => {
		const ownership = CommentOwnership.of({ authorUserId: 1 });

		expect(ownership.canBeManagedBy(1)).toBe(true);
		expect(ownership.canBeManagedBy(2)).toBe(false);
	});
});
