import { describe, expect, it } from "vitest";
import type { ArticleId } from "@/core/article/domain";
import { CommentBody, CommentEntity } from "@/core/comment/domain";
import type { CommentId } from "@/core/comment/domain/Comment";

const articleId = "1" as ArticleId;
const otherArticleId = "2" as ArticleId;
const commentId = "10" as CommentId;

function expectPresent<T>(value: T | null) {
	expect(value).not.toBeNull();

	if (value === null) {
		throw new Error("Expected value to be present.");
	}

	return value;
}

describe("CommentEntity reply target", () => {
	it("allows replies only to active top-level comments in the same article", () => {
		expect(
			CommentEntity.rehydrate({
				articleId,
				authorUserId: 1,
				deleted: false,
				id: commentId,
				parentCommentId: null,
			}).canReceiveReplyFor(articleId),
		).toBe(true);

		expect(
			CommentEntity.rehydrate({
				articleId: otherArticleId,
				authorUserId: 1,
				deleted: false,
				id: commentId,
				parentCommentId: null,
			}).canReceiveReplyFor(articleId),
		).toBe(false);

		expect(
			CommentEntity.rehydrate({
				articleId,
				authorUserId: 1,
				deleted: true,
				id: commentId,
				parentCommentId: null,
			}).canReceiveReplyFor(articleId),
		).toBe(false);

		expect(
			CommentEntity.rehydrate({
				articleId,
				authorUserId: 1,
				deleted: false,
				id: commentId,
				parentCommentId: commentId,
			}).canReceiveReplyFor(articleId),
		).toBe(false);
	});

	it("returns a reply plan for active top-level comments", () => {
		const comment = CommentEntity.rehydrate({
			articleId,
			authorUserId: 1,
			deleted: false,
			id: commentId,
			parentCommentId: null,
		});

		expect(comment.planReplyFor(articleId)).toEqual({
			parentCommentAuthorUserId: 1,
			parentCommentId: commentId,
		});
		expect(comment.planReplyFor(otherArticleId)).toBeNull();
	});
});

describe("CommentEntity ownership", () => {
	it("allows only the comment author to manage the comment", () => {
		const comment = CommentEntity.rehydrate({
			articleId,
			authorUserId: 1,
			deleted: false,
			id: commentId,
			parentCommentId: null,
		});

		expect(comment.canBeManagedBy(1)).toBe(true);
		expect(comment.canBeManagedBy(2)).toBe(false);
	});

	it("plans updates and deletes only for the comment author", () => {
		const comment = CommentEntity.rehydrate({
			articleId,
			authorUserId: 1,
			deleted: false,
			id: commentId,
			parentCommentId: null,
		});
		const updateBody = expectPresent(CommentBody.from(" 수정한 댓글 "));
		const deletedBody = expectPresent(CommentBody.from("삭제된 댓글"));
		expect(
			comment.planUpdate({
				body: updateBody,
				userId: 1,
			}),
		).toEqual({
			body: "수정한 댓글",
			commentId,
		});
		expect(
			comment.planUpdate({
				body: updateBody,
				userId: 2,
			}),
		).toBeNull();
		expect(
			comment.planDelete({
				deletedBody,
				userId: 1,
			}),
		).toEqual({
			body: "삭제된 댓글",
			commentId,
		});
	});

	it("rejects blank comment bodies", () => {
		expect(CommentBody.from("   ")).toBeNull();
	});
});
