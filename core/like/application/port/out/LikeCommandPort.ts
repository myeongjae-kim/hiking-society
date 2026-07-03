import type { ArticleId } from '@/core/article/domain';
import type { CommentId } from '@/core/comment/domain';

export interface LikeCommandPort {
  toggleArticleLike(input: { articleId: ArticleId; userId: number }): Promise<void>;
  toggleCommentLike(input: { commentId: CommentId; userId: number }): Promise<void>;
}
