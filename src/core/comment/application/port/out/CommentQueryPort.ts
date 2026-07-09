import type { ArticleId } from "@/core/article/domain";
import type { Comment } from "@/core/comment/domain";

export interface CommentQueryPort {
	listArticleComments(input: {
		articleId: ArticleId;
		currentUserId: number;
	}): Promise<readonly Comment[]>;
}
