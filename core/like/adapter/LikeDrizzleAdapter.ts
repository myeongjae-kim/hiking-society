import { createNotificationContentExcerpt } from '@/core/notification/model/NotificationContentExcerpt';
import { db } from '@/lib/db/drizzle';
import {
  articleLikeTable,
  articleTable,
  commentLikeTable,
  commentTable,
  notificationTable,
} from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import type { LikeCommandPort } from '../application/port/out/LikeCommandPort';

function toNumericId(id: string) {
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error('잘못된 id입니다.');
  }

  return numericId;
}

export class LikeDrizzleAdapter implements LikeCommandPort {
  async toggleArticleLike(input: Parameters<LikeCommandPort['toggleArticleLike']>[0]) {
    const articleId = toNumericId(input.articleId);

    await db.transaction(async (tx) => {
      const [article] = await tx
        .select({
          authorUserId: articleTable.authorUserId,
          body: articleTable.body,
          id: articleTable.id,
        })
        .from(articleTable)
        .where(and(eq(articleTable.id, articleId), isNull(articleTable.deletedAt)))
        .limit(1);

      if (!article) {
        throw new Error('좋아요할 글을 찾을 수 없습니다.');
      }

      const [existingLike] = await tx
        .select({ id: articleLikeTable.id })
        .from(articleLikeTable)
        .where(
          and(eq(articleLikeTable.articleId, articleId), eq(articleLikeTable.userId, input.userId)),
        )
        .limit(1);

      if (existingLike) {
        await tx.delete(articleLikeTable).where(eq(articleLikeTable.id, existingLike.id));
        return;
      }

      await tx.insert(articleLikeTable).values({ articleId, userId: input.userId });

      if (article.authorUserId !== input.userId) {
        await tx.insert(notificationTable).values({
          actorUserId: input.userId,
          articleId,
          commentId: null,
          contentExcerpt: createNotificationContentExcerpt(article.body),
          recipientUserId: article.authorUserId,
          type: 'article_like',
        });
      }
    });
  }

  async toggleCommentLike(input: Parameters<LikeCommandPort['toggleCommentLike']>[0]) {
    const commentId = toNumericId(input.commentId);

    await db.transaction(async (tx) => {
      const [comment] = await tx
        .select({
          articleId: commentTable.articleId,
          authorUserId: commentTable.authorUserId,
          body: commentTable.body,
          id: commentTable.id,
        })
        .from(commentTable)
        .innerJoin(articleTable, eq(articleTable.id, commentTable.articleId))
        .where(
          and(
            eq(commentTable.id, commentId),
            isNull(commentTable.deletedAt),
            isNull(articleTable.deletedAt),
          ),
        )
        .limit(1);

      if (!comment) {
        throw new Error('좋아요할 댓글을 찾을 수 없습니다.');
      }

      const [existingLike] = await tx
        .select({ id: commentLikeTable.id })
        .from(commentLikeTable)
        .where(
          and(eq(commentLikeTable.commentId, commentId), eq(commentLikeTable.userId, input.userId)),
        )
        .limit(1);

      if (existingLike) {
        await tx.delete(commentLikeTable).where(eq(commentLikeTable.id, existingLike.id));
        return;
      }

      await tx.insert(commentLikeTable).values({ commentId, userId: input.userId });

      if (comment.authorUserId !== input.userId) {
        await tx.insert(notificationTable).values({
          actorUserId: input.userId,
          articleId: comment.articleId,
          commentId,
          contentExcerpt: createNotificationContentExcerpt(comment.body),
          recipientUserId: comment.authorUserId,
          type: 'comment_like',
        });
      }
    });
  }
}
