import type { ArticleId } from "@/core/article/domain";
import type { CommentId } from "@/core/comment/domain";

export interface CreateNotificationsUseCase {
	createArticleCreated(input: {
		readonly actorUserId: number;
		readonly articleBody: string;
		readonly articleId: ArticleId;
		readonly recipientUserIds: readonly number[];
	}): Promise<void>;
	createArticleLike(input: {
		readonly actorUserId: number;
		readonly articleAuthorUserId: number;
		readonly articleBody: string;
		readonly articleId: ArticleId;
	}): Promise<void>;
	createComment(input: {
		readonly actorUserId: number;
		readonly articleAuthorUserId: number;
		readonly articleId: ArticleId;
		readonly commentBody: string;
		readonly commentId: CommentId;
		readonly parentCommentAuthorUserId: number | null;
		readonly parentCommentId: CommentId | null;
	}): Promise<void>;
	createCommentLike(input: {
		readonly actorUserId: number;
		readonly articleId: ArticleId;
		readonly commentAuthorUserId: number;
		readonly commentBody: string;
		readonly commentId: CommentId;
	}): Promise<void>;
}
