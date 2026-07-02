import type { ExistingArticlePhotoInput } from '@/core/article/application/port/in/ArticleCommandUseCase';
import type { ArticleId, ArticlePhoto, UpdateArticleInput } from '@/core/article/domain';
import type {
  CommentId,
  CreateCommentInput,
  CreateReplyInput,
  UpdateCommentInput,
} from '@/core/comment/domain';
import type { CreateHikingInput, HikingId, UpdateHikingInput } from '@/core/hiking/domain';

export type StoredArticlePhoto = ArticlePhoto & {
  readonly byteSize: number;
  readonly contentType: string;
  readonly objectKey: string;
};

export interface FeedCommandPort {
  createHiking(input: CreateHikingInput): Promise<void>;
  updateHiking(input: {
    hikingId: HikingId;
    userId: number;
    values: UpdateHikingInput;
  }): Promise<void>;
  deleteHiking(input: { hikingId: HikingId; userId: number }): Promise<void>;
  createArticle(input: {
    authorUserId: number;
    body: string;
    hikingId: HikingId;
    storedPhotos: readonly StoredArticlePhoto[];
  }): Promise<void>;
  updateArticle(input: {
    articleId: ArticleId;
    storedPhotos: readonly (StoredArticlePhoto | ExistingArticlePhotoInput)[];
    userId: number;
    values: UpdateArticleInput;
  }): Promise<void>;
  deleteArticle(input: { articleId: ArticleId; userId: number }): Promise<void>;
  createComment(input: CreateCommentInput | CreateReplyInput): Promise<void>;
  updateComment(input: {
    commentId: CommentId;
    userId: number;
    values: UpdateCommentInput;
  }): Promise<void>;
  deleteComment(input: { commentId: CommentId; userId: number }): Promise<void>;
}
