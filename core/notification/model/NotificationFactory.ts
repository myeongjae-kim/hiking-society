import type { ArticleId } from '@/core/article/domain';
import type { CommentId } from '@/core/comment/domain';
import type { NotificationType } from './Notification';
import { createNotificationContentExcerpt } from './NotificationContentExcerpt';

export type CreateNotificationInput = {
  readonly actorUserId: number;
  readonly articleId: ArticleId;
  readonly commentId: CommentId | null;
  readonly contentExcerpt: string;
  readonly recipientUserId: number;
  readonly type: NotificationType;
};

export function createArticleCreatedNotifications(input: {
  readonly actorUserId: number;
  readonly articleBody: string;
  readonly articleId: ArticleId;
  readonly recipientUserIds: readonly number[];
}): readonly CreateNotificationInput[] {
  const contentExcerpt = createNotificationContentExcerpt(input.articleBody);

  return input.recipientUserIds.map((recipientUserId) => ({
    actorUserId: input.actorUserId,
    articleId: input.articleId,
    commentId: null,
    contentExcerpt,
    recipientUserId,
    type: 'article_created',
  }));
}

export function createCommentNotifications(input: {
  readonly actorUserId: number;
  readonly articleAuthorUserId: number;
  readonly articleId: ArticleId;
  readonly commentBody: string;
  readonly commentId: CommentId;
  readonly parentCommentAuthorUserId: number | null;
  readonly parentCommentId: CommentId | null;
}): readonly CreateNotificationInput[] {
  const notificationsByRecipientId = new Map<number, CreateNotificationInput>();
  const contentExcerpt = createNotificationContentExcerpt(input.commentBody);

  if (input.articleAuthorUserId !== input.actorUserId) {
    notificationsByRecipientId.set(input.articleAuthorUserId, {
      actorUserId: input.actorUserId,
      articleId: input.articleId,
      commentId: input.commentId,
      contentExcerpt,
      recipientUserId: input.articleAuthorUserId,
      type: input.parentCommentId === null ? 'article_comment' : 'article_reply',
    });
  }

  if (
    input.parentCommentAuthorUserId !== null &&
    input.parentCommentAuthorUserId !== input.actorUserId
  ) {
    notificationsByRecipientId.set(input.parentCommentAuthorUserId, {
      actorUserId: input.actorUserId,
      articleId: input.articleId,
      commentId: input.commentId,
      contentExcerpt,
      recipientUserId: input.parentCommentAuthorUserId,
      type: 'comment_reply',
    });
  }

  return [...notificationsByRecipientId.values()];
}

export function createArticleLikeNotification(input: {
  readonly actorUserId: number;
  readonly articleAuthorUserId: number;
  readonly articleBody: string;
  readonly articleId: ArticleId;
}): CreateNotificationInput | null {
  if (input.articleAuthorUserId === input.actorUserId) {
    return null;
  }

  return {
    actorUserId: input.actorUserId,
    articleId: input.articleId,
    commentId: null,
    contentExcerpt: createNotificationContentExcerpt(input.articleBody),
    recipientUserId: input.articleAuthorUserId,
    type: 'article_like',
  };
}

export function createCommentLikeNotification(input: {
  readonly actorUserId: number;
  readonly articleId: ArticleId;
  readonly commentAuthorUserId: number;
  readonly commentBody: string;
  readonly commentId: CommentId;
}): CreateNotificationInput | null {
  if (input.commentAuthorUserId === input.actorUserId) {
    return null;
  }

  return {
    actorUserId: input.actorUserId,
    articleId: input.articleId,
    commentId: input.commentId,
    contentExcerpt: createNotificationContentExcerpt(input.commentBody),
    recipientUserId: input.commentAuthorUserId,
    type: 'comment_like',
  };
}
