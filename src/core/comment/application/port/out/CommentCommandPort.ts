import type { ArticleId } from "@/core/article/domain";
import type { CommentId } from "@/core/comment/domain";

export type ActiveCommentArticleSnapshot = {
	readonly authorUserId: number;
	readonly body: string;
	readonly id: ArticleId;
};

export type CommentCommandSnapshot = {
	readonly articleId: ArticleId;
	readonly authorUserId: number;
	readonly body: string;
	readonly deleted: boolean;
	readonly id: CommentId;
};

export interface CommentCommandPort {
	create(input: {
		articleId: ArticleId;
		authorUserId: number;
		body: string;
		parentCommentId: CommentId | null;
	}): Promise<CommentId>;
	delete(input: {
		body: string;
		commentId: CommentId;
		now: Date;
	}): Promise<boolean>;
	findActiveArticleById(
		articleId: ArticleId,
	): Promise<ActiveCommentArticleSnapshot | null>;
	findCommentById(commentId: CommentId): Promise<CommentCommandSnapshot | null>;
	update(input: {
		body: string;
		commentId: CommentId;
		now: Date;
	}): Promise<boolean>;
}
