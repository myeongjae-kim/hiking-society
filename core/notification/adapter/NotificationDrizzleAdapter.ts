import type { AuthorName, IsoDateTimeString } from '@/core/common/domain';
import type { ArticleId } from '@/core/article/domain';
import type { CommentId } from '@/core/comment/domain';
import type { NotificationCommandPort } from '@/core/notification/application/port/out/NotificationCommandPort';
import type { NotificationQueryPort } from '@/core/notification/application/port/out/NotificationQueryPort';
import type { NotificationId } from '@/core/notification/model/Notification';
import { db } from '@/core/config/drizzle.server';
import { notificationTable, userTable } from '@/lib/db/schema';
import { and, desc, eq, isNull } from 'drizzle-orm';

function toNumericId(id: string) {
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error('잘못된 id입니다.');
  }

  return numericId;
}

function toIsoDateTime(value: Date | null) {
  return (value ? value.toISOString() : null) as IsoDateTimeString | null;
}

function toAuthorName(row: {
  displayName: string | null;
  email: string | null;
  name: string | null;
}) {
  return (row.displayName ?? row.name ?? row.email ?? '회원') as AuthorName;
}

export class NotificationDrizzleAdapter implements NotificationCommandPort, NotificationQueryPort {
  async createMany(input: Parameters<NotificationCommandPort['createMany']>[0]) {
    if (input.notifications.length === 0) {
      return;
    }

    await db.insert(notificationTable).values(
      input.notifications.map((notification) => ({
        actorUserId: notification.actorUserId,
        articleId: toNumericId(notification.articleId),
        commentId: notification.commentId ? toNumericId(notification.commentId) : null,
        contentExcerpt: notification.contentExcerpt,
        recipientUserId: notification.recipientUserId,
        type: notification.type,
      })),
    );
  }

  async list(input: Parameters<NotificationQueryPort['list']>[0]) {
    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;
    const [rows, unreadRows] = await Promise.all([
      db
        .select({
          actorUserId: notificationTable.actorUserId,
          articleId: notificationTable.articleId,
          commentId: notificationTable.commentId,
          contentExcerpt: notificationTable.contentExcerpt,
          createdAt: notificationTable.createdAt,
          displayName: userTable.displayName,
          email: userTable.email,
          id: notificationTable.id,
          name: userTable.name,
          profileImageUrl: userTable.profileImageUrl,
          readAt: notificationTable.readAt,
          type: notificationTable.type,
        })
        .from(notificationTable)
        .innerJoin(userTable, eq(userTable.id, notificationTable.actorUserId))
        .where(eq(notificationTable.recipientUserId, input.currentUserId))
        .orderBy(desc(notificationTable.createdAt))
        .limit(limit + 1)
        .offset(offset),
      db
        .select({ id: notificationTable.id })
        .from(notificationTable)
        .where(
          and(
            eq(notificationTable.recipientUserId, input.currentUserId),
            isNull(notificationTable.readAt),
          ),
        )
        .limit(1),
    ]);

    return {
      hasMoreNotifications: rows.length > limit,
      hasUnreadNotifications: unreadRows.length > 0,
      notifications: rows.slice(0, limit).map((row) => ({
        actorName: toAuthorName(row),
        actorProfileImageUrl: row.profileImageUrl,
        actorUserId: row.actorUserId,
        articleId: String(row.articleId) as ArticleId,
        commentId: row.commentId === null ? null : (String(row.commentId) as CommentId),
        contentExcerpt: row.contentExcerpt,
        createdAt: row.createdAt.toISOString() as IsoDateTimeString,
        id: String(row.id) as NotificationId,
        readAt: toIsoDateTime(row.readAt),
        type: row.type,
      })),
    };
  }

  async markAllRead(input: Parameters<NotificationCommandPort['markAllRead']>[0]) {
    await db
      .update(notificationTable)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notificationTable.recipientUserId, input.currentUserId),
          isNull(notificationTable.readAt),
        ),
      );
  }

  async markRead(input: Parameters<NotificationCommandPort['markRead']>[0]) {
    await db
      .update(notificationTable)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notificationTable.id, toNumericId(input.notificationId)),
          eq(notificationTable.recipientUserId, input.currentUserId),
          isNull(notificationTable.readAt),
        ),
      );
  }
}
