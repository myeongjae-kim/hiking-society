import type { ArticleId } from "@/core/article/domain";
import type { CommentId } from "./Comment";

type CommentSnapshot = {
	readonly articleId: ArticleId;
	readonly authorUserId: number;
	readonly deleted: boolean;
	readonly parentCommentId: CommentId | null;
};

export class CommentOwnership {
	private constructor(private readonly authorUserId: number) {}

	static of(comment: { readonly authorUserId: number }) {
		return new CommentOwnership(comment.authorUserId);
	}

	canBeManagedBy(userId: number) {
		return this.authorUserId === userId;
	}
}

export class CommentReplyTarget {
	private constructor(private readonly comment: CommentSnapshot | null) {}

	static of(comment: CommentSnapshot | null) {
		return new CommentReplyTarget(comment);
	}

	canReceiveReplyFor(articleId: ArticleId) {
		return (
			this.comment !== null &&
			this.comment.articleId === articleId &&
			!this.comment.deleted &&
			this.comment.parentCommentId === null
		);
	}
}
