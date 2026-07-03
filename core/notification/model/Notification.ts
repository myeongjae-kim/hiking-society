import type { ArticleId } from '@/core/article/domain';
import type { CommentId } from '@/core/comment/domain';
import type { AuthorName, Brand, IsoDateTimeString } from '@/core/common/domain';

export type NotificationId = Brand<string, 'NotificationId'>;

export type NotificationType =
  'article_comment' | 'article_reply' | 'comment_reply' | 'article_like' | 'comment_like';

export type NotificationSummary = {
  readonly id: NotificationId;
  readonly actorName: AuthorName;
  readonly actorProfileImageUrl: string | null;
  readonly actorUserId: number;
  readonly articleId: ArticleId;
  readonly commentId: CommentId | null;
  readonly createdAt: IsoDateTimeString;
  readonly readAt: IsoDateTimeString | null;
  readonly type: NotificationType;
};

export type Notification = NotificationSummary;

export type NotificationListSnapshot = {
  readonly hasUnreadNotifications: boolean;
  readonly notifications: readonly NotificationSummary[];
};
