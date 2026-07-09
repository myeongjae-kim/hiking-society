import type { ArticleId } from '@/core/article/domain';
import type { CommentId } from '@/core/comment/domain';

export type ArticleLikeToggleResult = {
  readonly articleAuthorUserId: number;
  readonly articleBody: string;
  readonly articleId: ArticleId;
  readonly liked: boolean;
};

export type CommentLikeToggleResult = {
  readonly articleId: ArticleId;
  readonly commentAuthorUserId: number;
  readonly commentBody: string;
  readonly commentId: CommentId;
  readonly liked: boolean;
};

export interface LikeCommandPort {
  toggleArticleLike(input: {
    articleId: ArticleId;
    userId: number;
  }): Promise<ArticleLikeToggleResult | null>;
  toggleCommentLike(input: {
    commentId: CommentId;
    userId: number;
  }): Promise<CommentLikeToggleResult | null>;
}
