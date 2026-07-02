import type { ExistingArticlePhotoInput } from '@/core/article/application/port/in/ArticleCommandUseCase';
import type { Article, ArticleId, ArticlePhoto, ArticlePhotos } from '@/core/article/domain';
import type { Comment, CommentId } from '@/core/comment/domain';
import type {
  AuthorName,
  IsoDateString,
  IsoDateTimeString,
  Latitude,
  Longitude,
  Timezone,
} from '@/core/common/domain';
import type {
  FeedCommandPort,
  StoredArticlePhoto,
} from '@/core/feed/application/port/out/FeedCommandPort';
import type { FeedQueryPort } from '@/core/feed/application/port/out/FeedQueryPort';
import type { Hiking, HikingId } from '@/core/hiking/domain';
import { db } from '@/lib/db/drizzle';
import {
  articlePhotoTable,
  articleTable,
  commentTable,
  hikingTable,
  userTable,
} from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

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

function toArticlePhotos(photos: readonly ArticlePhoto[]): ArticlePhotos | null {
  if (photos.length === 0) {
    return null;
  }

  return [photos[0], ...photos.slice(1)];
}

function getExistingPhotoInput(photo: ExistingArticlePhotoInput): StoredArticlePhoto {
  return {
    byteSize: photo.byteSize ?? 0,
    contentType: photo.contentType ?? 'image/*',
    objectKey: photo.objectKey ?? photo.url,
    order: photo.order,
    url: photo.url,
  };
}

export class FeedDrizzleAdapter implements FeedQueryPort, FeedCommandPort {
  async list() {
    const [hikingRows, articleRows, photoRows, commentRows] = await Promise.all([
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
          mountainName: hikingTable.mountainName,
          name: userTable.name,
          participantsCsv: hikingTable.participantsCsv,
          restaurantAddress: hikingTable.restaurantAddress,
          startedAt: hikingTable.startedAt,
          timezone: hikingTable.timezone,
          updatedAt: hikingTable.updatedAt,
        })
        .from(hikingTable)
        .innerJoin(userTable, eq(userTable.id, hikingTable.authorUserId))
        .where(isNull(userTable.deletedAt)),
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
          updatedAt: articleTable.updatedAt,
        })
        .from(articleTable)
        .innerJoin(userTable, eq(userTable.id, articleTable.authorUserId))
        .where(isNull(userTable.deletedAt)),
      db.select().from(articlePhotoTable).orderBy(articlePhotoTable.order),
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
          updatedAt: commentTable.updatedAt,
        })
        .from(commentTable)
        .innerJoin(userTable, eq(userTable.id, commentTable.authorUserId))
        .where(isNull(userTable.deletedAt)),
    ]);

    const photosByArticleId = new Map<number, ArticlePhoto[]>();

    for (const photo of photoRows) {
      const photos = photosByArticleId.get(photo.articleId) ?? [];
      photos.push({
        byteSize: photo.byteSize,
        contentType: photo.contentType,
        objectKey: photo.objectKey,
        order: photo.order,
        url: photo.url,
      });
      photosByArticleId.set(photo.articleId, photos);
    }

    const hikings: Hiking[] = hikingRows.map((row) => ({
      authorName: toAuthorName(row),
      authorUserId: row.authorUserId,
      completedAt: row.completedAt as IsoDateTimeString,
      createdAt: row.createdAt.toISOString() as IsoDateTimeString,
      hikingDate: row.hikingDate as IsoDateString,
      id: String(row.id) as HikingId,
      latitude: row.latitude as Latitude,
      longitude: row.longitude as Longitude,
      mountainName: row.mountainName,
      participantsCsv: row.participantsCsv,
      restaurantAddress: row.restaurantAddress,
      startedAt: row.startedAt as IsoDateTimeString,
      timezone: row.timezone as Timezone,
      updatedAt: row.updatedAt.toISOString() as IsoDateTimeString,
    }));

    const articles: Article[] = articleRows.flatMap((row) => {
      const photos = toArticlePhotos(photosByArticleId.get(row.id) ?? []);

      if (!photos) {
        return [];
      }

      return [
        {
          authorName: toAuthorName(row),
          authorUserId: row.authorUserId,
          body: row.body,
          createdAt: row.createdAt.toISOString() as IsoDateTimeString,
          deletedAt: toIsoDateTime(row.deletedAt),
          edited: row.updatedAt.getTime() !== row.createdAt.getTime(),
          hikingId: String(row.hikingId) as HikingId,
          id: String(row.id) as ArticleId,
          photos,
          updatedAt: row.updatedAt.toISOString() as IsoDateTimeString,
        },
      ];
    });

    const comments: Comment[] = commentRows.map((row) => ({
      articleId: String(row.articleId) as ArticleId,
      authorName: toAuthorName(row),
      authorUserId: row.authorUserId,
      body: row.body,
      createdAt: row.createdAt.toISOString() as IsoDateTimeString,
      deletedAt: toIsoDateTime(row.deletedAt),
      id: String(row.id) as CommentId,
      parentCommentId:
        row.parentCommentId === null ? null : (String(row.parentCommentId) as CommentId),
      updatedAt: row.updatedAt.toISOString() as IsoDateTimeString,
    })) as Comment[];

    return { articles, comments, hikings };
  }

  async createHiking(input: Parameters<FeedCommandPort['createHiking']>[0]) {
    await db.insert(hikingTable).values({
      authorUserId: input.authorUserId,
      completedAt: input.completedAt,
      hikingDate: input.hikingDate,
      latitude: input.latitude,
      longitude: input.longitude,
      mountainName: input.mountainName,
      participantsCsv: input.participantsCsv,
      restaurantAddress: input.restaurantAddress,
      startedAt: input.startedAt,
      timezone: input.timezone,
    });
  }

  async updateHiking(input: Parameters<FeedCommandPort['updateHiking']>[0]) {
    const hikingId = toNumericId(input.hikingId);
    const [updated] = await db
      .update(hikingTable)
      .set({ ...input.values, updatedAt: new Date() })
      .where(and(eq(hikingTable.id, hikingId), eq(hikingTable.authorUserId, input.userId)))
      .returning({ id: hikingTable.id });

    if (!updated) {
      throw new Error('산행을 수정할 권한이 없거나 산행을 찾을 수 없습니다.');
    }
  }

  async deleteHiking(input: Parameters<FeedCommandPort['deleteHiking']>[0]) {
    const hikingId = toNumericId(input.hikingId);

    await db.transaction(async (tx) => {
      const [hiking] = await tx
        .select({ id: hikingTable.id })
        .from(hikingTable)
        .where(and(eq(hikingTable.id, hikingId), eq(hikingTable.authorUserId, input.userId)))
        .limit(1);

      if (!hiking) {
        throw new Error('산행을 삭제할 권한이 없거나 산행을 찾을 수 없습니다.');
      }

      const [article] = await tx
        .select({ id: articleTable.id })
        .from(articleTable)
        .where(and(eq(articleTable.hikingId, hikingId), isNull(articleTable.deletedAt)))
        .limit(1);

      if (article) {
        throw new Error('게시글이 있는 산행은 삭제할 수 없습니다.');
      }

      await tx.delete(hikingTable).where(eq(hikingTable.id, hikingId));
    });
  }

  async createArticle(input: Parameters<FeedCommandPort['createArticle']>[0]) {
    await db.transaction(async (tx) => {
      const [hiking] = await tx
        .select({ id: hikingTable.id })
        .from(hikingTable)
        .where(eq(hikingTable.id, toNumericId(input.hikingId)))
        .limit(1);

      if (!hiking) {
        throw new Error('산행을 찾을 수 없습니다.');
      }

      const [article] = await tx
        .insert(articleTable)
        .values({
          authorUserId: input.authorUserId,
          body: input.body,
          hikingId: hiking.id,
        })
        .returning({ id: articleTable.id });

      if (!article) {
        throw new Error('게시글을 저장하지 못했습니다.');
      }

      await tx.insert(articlePhotoTable).values(
        input.storedPhotos.map((photo) => ({
          articleId: article.id,
          byteSize: photo.byteSize,
          contentType: photo.contentType,
          objectKey: photo.objectKey,
          order: photo.order,
          url: photo.url,
        })),
      );
    });
  }

  async updateArticle(input: Parameters<FeedCommandPort['updateArticle']>[0]) {
    const articleId = toNumericId(input.articleId);
    const storedPhotos: StoredArticlePhoto[] = input.storedPhotos.map(getExistingPhotoInput);

    await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(articleTable)
        .set({ body: input.values.body, updatedAt: new Date() })
        .where(and(eq(articleTable.id, articleId), eq(articleTable.authorUserId, input.userId)))
        .returning({ id: articleTable.id });

      if (!updated) {
        throw new Error('게시글을 수정할 권한이 없거나 게시글을 찾을 수 없습니다.');
      }

      await tx.delete(articlePhotoTable).where(eq(articlePhotoTable.articleId, articleId));
      await tx.insert(articlePhotoTable).values(
        storedPhotos.map((photo) => ({
          articleId,
          byteSize: photo.byteSize,
          contentType: photo.contentType,
          objectKey: photo.objectKey,
          order: photo.order,
          url: photo.url,
        })),
      );
    });
  }

  async deleteArticle(input: Parameters<FeedCommandPort['deleteArticle']>[0]) {
    const [updated] = await db
      .update(articleTable)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(articleTable.id, toNumericId(input.articleId)),
          eq(articleTable.authorUserId, input.userId),
        ),
      )
      .returning({ id: articleTable.id });

    if (!updated) {
      throw new Error('게시글을 삭제할 권한이 없거나 게시글을 찾을 수 없습니다.');
    }
  }

  async createComment(input: Parameters<FeedCommandPort['createComment']>[0]) {
    await db.transaction(async (tx) => {
      const articleId = toNumericId(input.articleId);
      const parentCommentId =
        'parentCommentId' in input ? toNumericId(input.parentCommentId) : null;

      const [article] = await tx
        .select({ id: articleTable.id })
        .from(articleTable)
        .where(and(eq(articleTable.id, articleId), isNull(articleTable.deletedAt)))
        .limit(1);

      if (!article) {
        throw new Error('댓글을 작성할 게시글을 찾을 수 없습니다.');
      }

      if (parentCommentId !== null) {
        const [parent] = await tx
          .select({ articleId: commentTable.articleId, deletedAt: commentTable.deletedAt })
          .from(commentTable)
          .where(eq(commentTable.id, parentCommentId))
          .limit(1);

        if (!parent || parent.articleId !== articleId || parent.deletedAt !== null) {
          throw new Error('답글을 작성할 댓글을 찾을 수 없습니다.');
        }
      }

      await tx.insert(commentTable).values({
        articleId,
        authorUserId: input.authorUserId,
        body: input.body,
        parentCommentId,
      });
    });
  }

  async updateComment(input: Parameters<FeedCommandPort['updateComment']>[0]) {
    const [updated] = await db
      .update(commentTable)
      .set({ body: input.values.body, updatedAt: new Date() })
      .where(
        and(
          eq(commentTable.id, toNumericId(input.commentId)),
          eq(commentTable.authorUserId, input.userId),
        ),
      )
      .returning({ id: commentTable.id });

    if (!updated) {
      throw new Error('댓글을 수정할 권한이 없거나 댓글을 찾을 수 없습니다.');
    }
  }

  async deleteComment(input: Parameters<FeedCommandPort['deleteComment']>[0]) {
    const [updated] = await db
      .update(commentTable)
      .set({ body: '삭제된 댓글', deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(commentTable.id, toNumericId(input.commentId)),
          eq(commentTable.authorUserId, input.userId),
        ),
      )
      .returning({ id: commentTable.id });

    if (!updated) {
      throw new Error('댓글을 삭제할 권한이 없거나 댓글을 찾을 수 없습니다.');
    }
  }
}
