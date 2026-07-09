import type {
  Article,
  ArticleId,
  ArticleMedia,
  ArticleMediaItems,
  ArticleMediaMetadataSummary,
} from '@/core/article/domain';
import type { ArticleDetailQueryPort } from '@/core/article/application/port/out/ArticleDetailQueryPort';
import type { Comment, CommentId } from '@/core/comment/domain';
import type {
  Altitude,
  AuthorName,
  IsoDateString,
  IsoDateTimeString,
  Latitude,
  Longitude,
  Timezone,
} from '@/core/common/domain';
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
import { alias } from 'drizzle-orm/pg-core';
import { and, asc, eq, isNull } from 'drizzle-orm';

const hikingAuthorTable = alias(userTable, 'hiking_author');

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

export class ArticleDetailDrizzleAdapter implements ArticleDetailQueryPort {
  async get(input: Parameters<ArticleDetailQueryPort['get']>[0]) {
    const articleId = toNumericId(input.articleId);
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
            hikingAltitude: hikingTable.altitude,
            hikingAuthorDisplayName: hikingAuthorTable.displayName,
            hikingAuthorEmail: hikingAuthorTable.email,
            hikingAuthorName: hikingAuthorTable.name,
            hikingAuthorUserId: hikingTable.authorUserId,
            hikingCompletedAt: hikingTable.completedAt,
            hikingCreatedAt: hikingTable.createdAt,
            hikingDate: hikingTable.hikingDate,
            hikingId: articleTable.hikingId,
            hikingLatitude: hikingTable.latitude,
            hikingLongitude: hikingTable.longitude,
            hikingMountainName: hikingTable.mountainName,
            hikingOrder: hikingTable.order,
            hikingParticipantsCsv: hikingTable.participantsCsv,
            hikingRestaurantAddress: hikingTable.restaurantAddress,
            hikingStartedAt: hikingTable.startedAt,
            hikingTimezone: hikingTable.timezone,
            hikingUpdatedAt: hikingTable.updatedAt,
            id: articleTable.id,
            name: userTable.name,
            profileImageUrl: userTable.profileImageUrl,
            updatedAt: articleTable.updatedAt,
          })
          .from(articleTable)
          .innerJoin(userTable, eq(userTable.id, articleTable.authorUserId))
          .innerJoin(hikingTable, eq(hikingTable.id, articleTable.hikingId))
          .innerJoin(hikingAuthorTable, eq(hikingAuthorTable.id, hikingTable.authorUserId))
          .where(
            and(
              eq(articleTable.id, articleId),
              isNull(articleTable.deletedAt),
              isNull(hikingTable.deletedAt),
              isNull(hikingAuthorTable.deletedAt),
              isNull(userTable.deletedAt),
            ),
          )
          .limit(1),
        db
          .select({
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
          .where(eq(articleMediaTable.articleId, articleId))
          .orderBy(asc(articleMediaTable.order)),
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
          .innerJoin(userTable, eq(userTable.id, commentTable.authorUserId))
          .where(and(eq(commentTable.articleId, articleId), isNull(userTable.deletedAt)))
          .orderBy(asc(commentTable.createdAt)),
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
              eq(articleLikeTable.articleId, articleId),
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
          .innerJoin(userTable, eq(userTable.id, commentLikeTable.userId))
          .where(
            and(
              eq(commentTable.articleId, articleId),
              isNull(commentTable.deletedAt),
              isNull(userTable.deletedAt),
            ),
          ),
      ]);

    const [row] = articleRows;
    const media = toArticleMedia(
      mediaRows.map((mediaRow) => ({
        byteSize: mediaRow.byteSize,
        contentType: mediaRow.contentType,
        durationMs: mediaRow.durationMs,
        height: mediaRow.height,
        mediaType: mediaRow.mediaType,
        metadata: toMetadataSummary({
          dateTime: mediaRow.metadataDateTime,
          exposureTime: mediaRow.metadataExposureTime,
          fNumber: mediaRow.metadataFNumber,
          focalLengthIn35mmFilm: mediaRow.metadataFocalLengthIn35mmFilm,
          isoSpeedRatings: mediaRow.metadataIsoSpeedRatings,
          make: mediaRow.metadataMake,
          model: mediaRow.metadataModel,
          shutterSpeedValue: mediaRow.metadataShutterSpeedValue,
        }),
        objectKey: mediaRow.objectKey,
        order: mediaRow.order,
        thumbnailUrl: mediaRow.thumbnailUrl,
        url: mediaRow.url,
        width: mediaRow.width,
      })),
    );

    if (!row || !media) {
      return null;
    }

    const articleLikeCountByArticleId = new Map<number, number>();
    const likedArticleIdsByCurrentUser = new Set<number>();
    const commentLikeCountByCommentId = new Map<number, number>();
    const likedCommentIdsByCurrentUser = new Set<number>();

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

    const hiking: Hiking = {
      authorName: toAuthorName({
        displayName: row.hikingAuthorDisplayName,
        email: row.hikingAuthorEmail,
        name: row.hikingAuthorName,
      }),
      authorUserId: row.hikingAuthorUserId,
      completedAt: row.hikingCompletedAt as IsoDateTimeString,
      createdAt: row.hikingCreatedAt.toISOString() as IsoDateTimeString,
      hikingDate: row.hikingDate as IsoDateString,
      id: String(row.hikingId) as HikingId,
      latitude: row.hikingLatitude as Latitude,
      longitude: row.hikingLongitude as Longitude,
      altitude: row.hikingAltitude as Altitude | null,
      mountainName: row.hikingMountainName,
      order: row.hikingOrder ?? 0,
      participantsCsv: row.hikingParticipantsCsv,
      restaurantAddress: row.hikingRestaurantAddress,
      startedAt: row.hikingStartedAt as IsoDateTimeString,
      timezone: row.hikingTimezone as Timezone,
      updatedAt: row.hikingUpdatedAt.toISOString() as IsoDateTimeString,
    };

    const article: Article = {
      authorName: toAuthorName(row),
      authorProfileImageUrl: row.profileImageUrl,
      authorUserId: row.authorUserId,
      body: row.body,
      createdAt: row.createdAt.toISOString() as IsoDateTimeString,
      deletedAt: toIsoDateTime(row.deletedAt),
      edited: row.updatedAt.getTime() !== row.createdAt.getTime(),
      hikingId: String(row.hikingId) as Article['hikingId'],
      id: String(row.id) as ArticleId,
      likeCount: articleLikeCountByArticleId.get(row.id) ?? 0,
      likedByCurrentUser: likedArticleIdsByCurrentUser.has(row.id),
      media,
      updatedAt: row.updatedAt.toISOString() as IsoDateTimeString,
    };

    const comments: Comment[] = commentRows.map((comment) => ({
      articleId: String(comment.articleId) as ArticleId,
      authorName: toAuthorName(comment),
      authorProfileImageUrl: comment.profileImageUrl,
      authorUserId: comment.authorUserId,
      body: comment.body,
      createdAt: comment.createdAt.toISOString() as IsoDateTimeString,
      deletedAt: toIsoDateTime(comment.deletedAt),
      id: String(comment.id) as CommentId,
      likeCount: commentLikeCountByCommentId.get(comment.id) ?? 0,
      likedByCurrentUser: likedCommentIdsByCurrentUser.has(comment.id),
      parentCommentId:
        comment.parentCommentId === null ? null : (String(comment.parentCommentId) as CommentId),
      updatedAt: comment.updatedAt.toISOString() as IsoDateTimeString,
    })) as Comment[];

    return { article, comments, hiking };
  }
}
