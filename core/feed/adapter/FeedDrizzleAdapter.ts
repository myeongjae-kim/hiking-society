import type {
  Article,
  ArticleId,
  ArticleMedia,
  ArticleMediaItems,
  ArticleMediaMetadataSummary,
} from '@/core/article/domain';
import type { Comment, CommentId } from '@/core/comment/domain';
import type { CommentQueryPort } from '@/core/comment/application/port/out/CommentQueryPort';
import type {
  Altitude,
  AuthorName,
  IsoDateString,
  IsoDateTimeString,
  Latitude,
  Longitude,
  Timezone,
} from '@/core/common/domain';
import type { FeedQueryPort } from '@/core/feed/application/port/out/FeedQueryPort';
import type { Hiking, HikingId } from '@/core/hiking/domain';
import { db } from '@/core/config/drizzle.server';
import {
  articleLikeTable,
  articleMediaMetadataTable,
  articleMediaTable,
  articleTable,
  commentLikeTable,
  commentTable,
  hikingTable,
  userTable,
} from '@/lib/db/schema';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';

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

function toArticleMedia(media: readonly ArticleMedia[]): ArticleMediaItems | null {
  if (media.length === 0) {
    return null;
  }

  return [media[0], ...media.slice(1)];
}

function toMetadataSummary(
  metadata: ArticleMediaMetadataSummary | null,
): ArticleMediaMetadataSummary | null {
  if (!metadata) {
    return null;
  }

  return Object.values(metadata).some(
    (value) => typeof value === 'string' && value.trim().length > 0,
  )
    ? metadata
    : null;
}

function incrementCount(counts: Map<number, number>, id: number) {
  counts.set(id, (counts.get(id) ?? 0) + 1);
}

export class FeedDrizzleAdapter implements FeedQueryPort, CommentQueryPort {
  async listHikings() {
    const [hikingRows, articleCountRows, commentCountRows] = await Promise.all([
      db
        .select({
          authorUserId: hikingTable.authorUserId,
          completedAt: hikingTable.completedAt,
          createdAt: hikingTable.createdAt,
          displayName: userTable.displayName,
          email: userTable.email,
          hikingDate: hikingTable.hikingDate,
          id: hikingTable.id,
          latitude: hikingTable.latitude,
          longitude: hikingTable.longitude,
          altitude: hikingTable.altitude,
          mountainName: hikingTable.mountainName,
          order: hikingTable.order,
          name: userTable.name,
          participantsCsv: hikingTable.participantsCsv,
          restaurantAddress: hikingTable.restaurantAddress,
          startedAt: hikingTable.startedAt,
          timezone: hikingTable.timezone,
          updatedAt: hikingTable.updatedAt,
        })
        .from(hikingTable)
        .innerJoin(userTable, eq(userTable.id, hikingTable.authorUserId))
        .where(and(isNull(hikingTable.deletedAt), isNull(userTable.deletedAt))),
      db
        .select({
          articleCount: sql<number>`count(*)::int`,
          hikingId: articleTable.hikingId,
        })
        .from(articleTable)
        .innerJoin(userTable, eq(userTable.id, articleTable.authorUserId))
        .where(and(isNull(articleTable.deletedAt), isNull(userTable.deletedAt)))
        .groupBy(articleTable.hikingId),
      db
        .select({
          commentCount: sql<number>`count(*)::int`,
        })
        .from(commentTable)
        .innerJoin(articleTable, eq(articleTable.id, commentTable.articleId))
        .innerJoin(userTable, eq(userTable.id, commentTable.authorUserId))
        .where(
          and(
            isNull(commentTable.deletedAt),
            isNull(articleTable.deletedAt),
            isNull(userTable.deletedAt),
          ),
        ),
    ]);

    const hikings: Hiking[] = hikingRows.map((row) => ({
      authorName: toAuthorName(row),
      authorUserId: row.authorUserId,
      completedAt: row.completedAt as IsoDateTimeString,
      createdAt: row.createdAt.toISOString() as IsoDateTimeString,
      hikingDate: row.hikingDate as IsoDateString,
      id: String(row.id) as HikingId,
      latitude: row.latitude as Latitude,
      longitude: row.longitude as Longitude,
      altitude: row.altitude as Altitude | null,
      mountainName: row.mountainName,
      order: row.order ?? 0,
      participantsCsv: row.participantsCsv,
      restaurantAddress: row.restaurantAddress,
      startedAt: row.startedAt as IsoDateTimeString,
      timezone: row.timezone as Timezone,
      updatedAt: row.updatedAt.toISOString() as IsoDateTimeString,
    }));
    const hikingArticleCounts = articleCountRows.map((row) => ({
      articleCount: row.articleCount,
      hikingId: String(row.hikingId) as HikingId,
    }));

    return {
      articleCount: hikingArticleCounts.reduce((total, row) => total + row.articleCount, 0),
      commentCount: commentCountRows[0]?.commentCount ?? 0,
      hikingArticleCounts,
      hikings,
    };
  }

  async listHikingArticles(input: Parameters<FeedQueryPort['listHikingArticles']>[0]) {
    const hikingId = toNumericId(input.hikingId);
    const [articleRows, mediaRows, commentRows, articleLikeRows, commentLikeRows] =
      await Promise.all([
        db
          .select({
            authorUserId: articleTable.authorUserId,
            body: articleTable.body,
            createdAt: articleTable.createdAt,
            deletedAt: articleTable.deletedAt,
            displayName: userTable.displayName,
            email: userTable.email,
            hikingId: articleTable.hikingId,
            id: articleTable.id,
            name: userTable.name,
            profileImageUrl: userTable.profileImageUrl,
            updatedAt: articleTable.updatedAt,
          })
          .from(articleTable)
          .innerJoin(userTable, eq(userTable.id, articleTable.authorUserId))
          .where(
            and(
              eq(articleTable.hikingId, hikingId),
              isNull(articleTable.deletedAt),
              isNull(userTable.deletedAt),
            ),
          ),
        db
          .select({
            articleId: articleMediaTable.articleId,
            byteSize: articleMediaTable.byteSize,
            contentType: articleMediaTable.contentType,
            durationMs: articleMediaTable.durationMs,
            height: articleMediaTable.height,
            mediaType: articleMediaTable.mediaType,
            metadataDateTime: articleMediaMetadataTable.dateTime,
            metadataExposureTime: articleMediaMetadataTable.exposureTime,
            metadataFNumber: articleMediaMetadataTable.fNumber,
            metadataFocalLengthIn35mmFilm: articleMediaMetadataTable.focalLengthIn35mmFilm,
            metadataIsoSpeedRatings: articleMediaMetadataTable.isoSpeedRatings,
            metadataMake: articleMediaMetadataTable.make,
            metadataModel: articleMediaMetadataTable.model,
            metadataShutterSpeedValue: articleMediaMetadataTable.shutterSpeedValue,
            objectKey: articleMediaTable.objectKey,
            order: articleMediaTable.order,
            thumbnailUrl: articleMediaTable.thumbnailUrl,
            url: articleMediaTable.url,
            width: articleMediaTable.width,
          })
          .from(articleMediaTable)
          .leftJoin(
            articleMediaMetadataTable,
            eq(articleMediaMetadataTable.articleMediaId, articleMediaTable.id),
          )
          .innerJoin(articleTable, eq(articleTable.id, articleMediaTable.articleId))
          .where(and(eq(articleTable.hikingId, hikingId), isNull(articleTable.deletedAt)))
          .orderBy(articleMediaTable.order),
        db
          .select({
            articleId: commentTable.articleId,
            authorUserId: commentTable.authorUserId,
            body: commentTable.body,
            createdAt: commentTable.createdAt,
            deletedAt: commentTable.deletedAt,
            displayName: userTable.displayName,
            email: userTable.email,
            id: commentTable.id,
            name: userTable.name,
            parentCommentId: commentTable.parentCommentId,
            profileImageUrl: userTable.profileImageUrl,
            updatedAt: commentTable.updatedAt,
          })
          .from(commentTable)
          .innerJoin(articleTable, eq(articleTable.id, commentTable.articleId))
          .innerJoin(userTable, eq(userTable.id, commentTable.authorUserId))
          .where(
            and(
              eq(articleTable.hikingId, hikingId),
              isNull(articleTable.deletedAt),
              isNull(userTable.deletedAt),
            ),
          ),
        db
          .select({
            articleId: articleLikeTable.articleId,
            userId: articleLikeTable.userId,
          })
          .from(articleLikeTable)
          .innerJoin(articleTable, eq(articleTable.id, articleLikeTable.articleId))
          .innerJoin(userTable, eq(userTable.id, articleLikeTable.userId))
          .where(
            and(
              eq(articleTable.hikingId, hikingId),
              isNull(articleTable.deletedAt),
              isNull(userTable.deletedAt),
            ),
          ),
        db
          .select({
            commentId: commentLikeTable.commentId,
            userId: commentLikeTable.userId,
          })
          .from(commentLikeTable)
          .innerJoin(commentTable, eq(commentTable.id, commentLikeTable.commentId))
          .innerJoin(articleTable, eq(articleTable.id, commentTable.articleId))
          .innerJoin(userTable, eq(userTable.id, commentLikeTable.userId))
          .where(
            and(
              eq(articleTable.hikingId, hikingId),
              isNull(commentTable.deletedAt),
              isNull(articleTable.deletedAt),
              isNull(userTable.deletedAt),
            ),
          ),
      ]);

    const mediaByArticleId = new Map<number, ArticleMedia[]>();
    const articleLikeCountByArticleId = new Map<number, number>();
    const likedArticleIdsByCurrentUser = new Set<number>();
    const commentLikeCountByCommentId = new Map<number, number>();
    const likedCommentIdsByCurrentUser = new Set<number>();

    for (const media of mediaRows) {
      const articleMedia = mediaByArticleId.get(media.articleId) ?? [];
      articleMedia.push({
        byteSize: media.byteSize,
        contentType: media.contentType,
        durationMs: media.durationMs,
        height: media.height,
        mediaType: media.mediaType,
        metadata: toMetadataSummary({
          dateTime: media.metadataDateTime,
          exposureTime: media.metadataExposureTime,
          fNumber: media.metadataFNumber,
          focalLengthIn35mmFilm: media.metadataFocalLengthIn35mmFilm,
          isoSpeedRatings: media.metadataIsoSpeedRatings,
          make: media.metadataMake,
          model: media.metadataModel,
          shutterSpeedValue: media.metadataShutterSpeedValue,
        }),
        objectKey: media.objectKey,
        order: media.order,
        thumbnailUrl: media.thumbnailUrl,
        url: media.url,
        width: media.width,
      });
      mediaByArticleId.set(media.articleId, articleMedia);
    }

    for (const like of articleLikeRows) {
      incrementCount(articleLikeCountByArticleId, like.articleId);

      if (like.userId === input.currentUserId) {
        likedArticleIdsByCurrentUser.add(like.articleId);
      }
    }

    for (const like of commentLikeRows) {
      incrementCount(commentLikeCountByCommentId, like.commentId);

      if (like.userId === input.currentUserId) {
        likedCommentIdsByCurrentUser.add(like.commentId);
      }
    }

    const articles: Article[] = articleRows.flatMap((row) => {
      const media = toArticleMedia(mediaByArticleId.get(row.id) ?? []);

      if (!media) {
        return [];
      }

      return [
        {
          authorName: toAuthorName(row),
          authorProfileImageUrl: row.profileImageUrl,
          authorUserId: row.authorUserId,
          body: row.body,
          createdAt: row.createdAt.toISOString() as IsoDateTimeString,
          deletedAt: toIsoDateTime(row.deletedAt),
          edited: row.updatedAt.getTime() !== row.createdAt.getTime(),
          hikingId: String(row.hikingId) as HikingId,
          id: String(row.id) as ArticleId,
          likeCount: articleLikeCountByArticleId.get(row.id) ?? 0,
          likedByCurrentUser: likedArticleIdsByCurrentUser.has(row.id),
          media,
          updatedAt: row.updatedAt.toISOString() as IsoDateTimeString,
        },
      ];
    });

    const comments: Comment[] = commentRows.map((row) => ({
      articleId: String(row.articleId) as ArticleId,
      authorName: toAuthorName(row),
      authorProfileImageUrl: row.profileImageUrl,
      authorUserId: row.authorUserId,
      body: row.body,
      createdAt: row.createdAt.toISOString() as IsoDateTimeString,
      deletedAt: toIsoDateTime(row.deletedAt),
      id: String(row.id) as CommentId,
      likeCount: commentLikeCountByCommentId.get(row.id) ?? 0,
      likedByCurrentUser: likedCommentIdsByCurrentUser.has(row.id),
      parentCommentId:
        row.parentCommentId === null ? null : (String(row.parentCommentId) as CommentId),
      updatedAt: row.updatedAt.toISOString() as IsoDateTimeString,
    })) as Comment[];

    return { articles, comments };
  }

  async listArticleComments(input: Parameters<CommentQueryPort['listArticleComments']>[0]) {
    const articleId = toNumericId(input.articleId);
    const [commentRows, commentLikeRows] = await Promise.all([
      db
        .select({
          articleId: commentTable.articleId,
          authorUserId: commentTable.authorUserId,
          body: commentTable.body,
          createdAt: commentTable.createdAt,
          deletedAt: commentTable.deletedAt,
          displayName: userTable.displayName,
          email: userTable.email,
          id: commentTable.id,
          name: userTable.name,
          parentCommentId: commentTable.parentCommentId,
          profileImageUrl: userTable.profileImageUrl,
          updatedAt: commentTable.updatedAt,
        })
        .from(commentTable)
        .innerJoin(articleTable, eq(articleTable.id, commentTable.articleId))
        .innerJoin(userTable, eq(userTable.id, commentTable.authorUserId))
        .where(
          and(
            eq(commentTable.articleId, articleId),
            isNull(articleTable.deletedAt),
            isNull(userTable.deletedAt),
          ),
        )
        .orderBy(asc(commentTable.createdAt)),
      db
        .select({
          commentId: commentLikeTable.commentId,
          userId: commentLikeTable.userId,
        })
        .from(commentLikeTable)
        .innerJoin(commentTable, eq(commentTable.id, commentLikeTable.commentId))
        .innerJoin(articleTable, eq(articleTable.id, commentTable.articleId))
        .innerJoin(userTable, eq(userTable.id, commentLikeTable.userId))
        .where(
          and(
            eq(commentTable.articleId, articleId),
            isNull(commentTable.deletedAt),
            isNull(articleTable.deletedAt),
            isNull(userTable.deletedAt),
          ),
        ),
    ]);

    const commentLikeCountByCommentId = new Map<number, number>();
    const likedCommentIdsByCurrentUser = new Set<number>();

    for (const like of commentLikeRows) {
      incrementCount(commentLikeCountByCommentId, like.commentId);

      if (like.userId === input.currentUserId) {
        likedCommentIdsByCurrentUser.add(like.commentId);
      }
    }

    return commentRows.map((row) => ({
      articleId: String(row.articleId) as ArticleId,
      authorName: toAuthorName(row),
      authorProfileImageUrl: row.profileImageUrl,
      authorUserId: row.authorUserId,
      body: row.body,
      createdAt: row.createdAt.toISOString() as IsoDateTimeString,
      deletedAt: toIsoDateTime(row.deletedAt),
      id: String(row.id) as CommentId,
      likeCount: commentLikeCountByCommentId.get(row.id) ?? 0,
      likedByCurrentUser: likedCommentIdsByCurrentUser.has(row.id),
      parentCommentId:
        row.parentCommentId === null ? null : (String(row.parentCommentId) as CommentId),
      updatedAt: row.updatedAt.toISOString() as IsoDateTimeString,
    })) as Comment[];
  }

}
