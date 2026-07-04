'use server';

import type {
  ArticleMediaUpload,
  ExistingArticleMediaInput,
} from '@/core/article/application/port/in/ArticleCommandUseCase';
import type { ArticleMediaUploadTarget } from '@/core/article/application/port/out/MediaStoragePort';
import type { Article, ArticleId } from '@/core/article/domain';
import type { Comment, CommentId } from '@/core/comment/domain';
import type {
  Altitude,
  IsoDateString,
  IsoDateTimeString,
  Latitude,
  Longitude,
  Timezone,
} from '@/core/common/domain';
import { applicationContext } from '@/core/config/applicationContext';
import { env } from '@/core/config/env';
import type { HikingId } from '@/core/hiking/domain';
import { sanitizeOriginalPhotoMetadata } from '@/app/common/utils/photoMetadata';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireCurrentUser } from '../auth/actions/session';

type ActionResult = {
  error?: string;
  ok: boolean;
};

export type LoadHikingArticlesResult =
  | {
      error?: string;
      ok: false;
    }
  | {
      articles: readonly Article[];
      comments: readonly Comment[];
      ok: true;
    };

export type ArticleMediaUploadTargetInput = {
  byteSize: number;
  contentType: string;
  fileName: string;
  mediaType: 'image' | 'video';
  thumbnail?: {
    byteSize: number;
    contentType: string;
    fileName: string;
  };
};

export type ArticleMediaUploadTargetResult =
  | {
      error?: string;
      ok: false;
    }
  | {
      targets: ArticleMediaUploadTarget[];
      ok: true;
    };

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);

const hikingSchema = z.object({
  altitude: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.coerce.number().finite().nullable(),
  ),
  completedTime: timeSchema,
  hikingDate: dateSchema,
  latitude: z.coerce.number().finite().min(-90).max(90),
  longitude: z.coerce.number().finite().min(-180).max(180),
  mountainName: z.string().trim().min(1).max(120),
  participantsCsv: z.string().trim().min(1),
  restaurantAddress: z.string().trim(),
  startedTime: timeSchema,
  timezone: z.string().trim().min(1).max(80),
});

const articleSchema = z.object({
  body: z.string().trim().min(1),
});

const originalMetadataSchema = z.record(z.string(), z.unknown()).nullable();
const uploadTargetInputSchema = z.object({
  byteSize: z
    .number()
    .int()
    .positive()
    .max(200 * 1024 * 1024),
  contentType: z.string().trim().min(1).max(120),
  fileName: z.string().trim().min(1).max(255),
  mediaType: z.enum(['image', 'video']),
  thumbnail: z
    .object({
      byteSize: z
        .number()
        .int()
        .positive()
        .max(25 * 1024 * 1024),
      contentType: z.string().trim().min(1).max(120),
      fileName: z.string().trim().min(1).max(255),
    })
    .optional(),
});
const uploadedMediaSchema = z.array(
  z.object({
    byteSize: z.number().int().positive(),
    contentType: z.string().trim().min(1).max(120),
    durationMs: z.number().nullable().optional(),
    height: z.number().nullable().optional(),
    mediaType: z.enum(['image', 'video']),
    objectKey: z.string().trim().min(1).max(1024),
    order: z.number().int().positive(),
    originalMetadata: originalMetadataSchema.optional(),
    thumbnailUrl: z.string().url().nullable().optional(),
    url: z.string().url(),
    width: z.number().nullable().optional(),
  }),
);

const commentSchema = z.object({
  body: z.string().trim().min(1),
});

function makeDateTime(date: string, time: string, timezone: string) {
  const offset = timezone === 'Asia/Seoul' ? '+09:00' : '';
  return `${date}T${time}:00${offset}` as IsoDateTimeString;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function getId<T extends string>(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!/^\d+$/.test(value)) {
    throw new Error('잘못된 id입니다.');
  }

  return value as T;
}

function getOptionalId<T extends string>(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error('잘못된 id입니다.');
  }

  return value as T;
}

function getRawId<T extends string>(value: string) {
  if (!/^\d+$/.test(value)) {
    throw new Error('잘못된 id입니다.');
  }

  return value as T;
}

function assertArticleObjectKey(objectKey: string, userId: number) {
  if (!objectKey.startsWith(`article-media/users/${userId}/`)) {
    throw new Error('잘못된 업로드 파일입니다.');
  }
}

function assertPublicUrl(url: string, objectKey: string) {
  const expectedUrl = `${env.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${objectKey
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')}`;

  if (url !== expectedUrl) {
    throw new Error('잘못된 업로드 URL입니다.');
  }
}

function assertArticleUploadPublicUrl(url: string, userId: number) {
  const expectedPrefix = `${env.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/article-media/users/${userId}/`;

  if (!url.startsWith(expectedPrefix)) {
    throw new Error('잘못된 업로드 URL입니다.');
  }
}

async function requireMember() {
  const user = await requireCurrentUser();

  if (user.role === 'associate') {
    throw new Error('정회원만 사용할 수 있습니다.');
  }

  return user;
}

function toActionResult(error: unknown): ActionResult {
  return {
    error: error instanceof Error ? error.message : '요청을 처리하지 못했습니다.',
    ok: false,
  };
}

function success(articleId?: ArticleId | null): ActionResult {
  revalidatePath('/feed');

  if (articleId) {
    revalidatePath(`/article/${articleId}`);
  }

  return { ok: true };
}

function parseHikingValues(formData: FormData) {
  const values = hikingSchema.parse({
    altitude: getString(formData, 'altitude'),
    completedTime: getString(formData, 'completedTime'),
    hikingDate: getString(formData, 'hikingDate'),
    latitude: getString(formData, 'latitude'),
    longitude: getString(formData, 'longitude'),
    mountainName: getString(formData, 'mountainName'),
    participantsCsv: getString(formData, 'participantsCsv'),
    restaurantAddress: getString(formData, 'restaurantAddress'),
    startedTime: getString(formData, 'startedTime'),
    timezone: getString(formData, 'timezone'),
  });

  return {
    altitude: values.altitude === null ? null : (values.altitude as Altitude),
    completedAt: makeDateTime(values.hikingDate, values.completedTime, values.timezone),
    hikingDate: values.hikingDate as IsoDateString,
    latitude: values.latitude as Latitude,
    longitude: values.longitude as Longitude,
    mountainName: values.mountainName,
    participantsCsv: values.participantsCsv,
    restaurantAddress: values.restaurantAddress || null,
    startedAt: makeDateTime(values.hikingDate, values.startedTime, values.timezone),
    timezone: values.timezone as Timezone,
  };
}

function parseMediaUploads(formData: FormData, userId: number): ArticleMediaUpload[] {
  const raw = getString(formData, 'uploadedMedia');

  if (!raw) {
    return [];
  }

  return uploadedMediaSchema.parse(JSON.parse(raw)).map((media) => {
    assertArticleObjectKey(media.objectKey, userId);
    assertPublicUrl(media.url, media.objectKey);

    if (media.thumbnailUrl) {
      assertArticleUploadPublicUrl(media.thumbnailUrl, userId);
    }

    if (media.mediaType === 'image' && media.contentType !== 'image/webp') {
      throw new Error('게시글 이미지는 WEBP 형식이어야 합니다.');
    }

    if (media.mediaType === 'video' && media.contentType !== 'video/mp4') {
      throw new Error('게시글 동영상은 MP4 형식이어야 합니다.');
    }

    return {
      byteSize: media.byteSize,
      contentType: media.contentType,
      durationMs: media.durationMs ?? null,
      height: media.height ?? null,
      mediaType: media.mediaType,
      objectKey: media.objectKey,
      order: media.order,
      originalMetadata: sanitizeOriginalPhotoMetadata(media.originalMetadata ?? null),
      thumbnailUrl: media.thumbnailUrl ?? null,
      url: media.url,
      width: media.width ?? null,
    };
  });
}

function parseExistingMedia(formData: FormData): ExistingArticleMediaInput[] {
  const raw = getString(formData, 'existingMedia');

  if (!raw) {
    return [];
  }

  const parsed = z
    .array(
      z.object({
        byteSize: z.number().optional(),
        contentType: z.string().optional(),
        durationMs: z.number().nullable().optional(),
        height: z.number().nullable().optional(),
        mediaType: z.enum(['image', 'video']),
        metadata: z
          .object({
            dateTime: z.string().nullable().optional(),
            exposureTime: z.string().nullable().optional(),
            fNumber: z.string().nullable().optional(),
            focalLengthIn35mmFilm: z.string().nullable().optional(),
            isoSpeedRatings: z.string().nullable().optional(),
            make: z.string().nullable().optional(),
            model: z.string().nullable().optional(),
            shutterSpeedValue: z.string().nullable().optional(),
          })
          .nullable()
          .optional(),
        objectKey: z.string().optional(),
        order: z.number().int().positive(),
        thumbnailUrl: z.string().nullable().optional(),
        url: z.string().min(1),
        width: z.number().nullable().optional(),
      }),
    )
    .parse(JSON.parse(raw));

  return parsed;
}

export async function loadHikingArticles(hikingId: HikingId): Promise<LoadHikingArticlesResult> {
  try {
    const user = await requireMember();
    const validatedHikingId = getRawId<HikingId>(hikingId);
    const snapshot = await applicationContext().get('ListFeedUseCase').listHikingArticles({
      currentUserId: user.id,
      hikingId: validatedHikingId,
    });

    return { ...snapshot, ok: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : '게시글을 불러오지 못했습니다.',
      ok: false,
    };
  }
}

export async function createHiking(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireMember();
    const values = parseHikingValues(formData);

    await applicationContext()
      .get('HikingCommandUseCase')
      .create({ ...values, authorUserId: user.id });

    return success();
  } catch (error) {
    return toActionResult(error);
  }
}

export async function updateHiking(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireMember();
    const hikingId = getId<HikingId>(formData, 'hikingId');
    const values = parseHikingValues(formData);

    await applicationContext().get('HikingCommandUseCase').update({
      hikingId,
      userId: user.id,
      values,
    });

    return success();
  } catch (error) {
    return toActionResult(error);
  }
}

export async function deleteHiking(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireMember();
    const hikingId = getId<HikingId>(formData, 'hikingId');

    await applicationContext().get('HikingCommandUseCase').delete({ hikingId, userId: user.id });

    return success();
  } catch (error) {
    return toActionResult(error);
  }
}

export async function createArticle(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireMember();
    const hikingId = getId<HikingId>(formData, 'hikingId');
    const values = articleSchema.parse({ body: getString(formData, 'body') });
    const media = parseMediaUploads(formData, user.id);

    if (media.length === 0) {
      throw new Error('게시글은 사진이나 동영상 없이 저장할 수 없습니다.');
    }

    await applicationContext().get('ArticleCommandUseCase').create({
      authorUserId: user.id,
      body: values.body,
      hikingId,
      media,
    });

    return success();
  } catch (error) {
    return toActionResult(error);
  }
}

export async function updateArticle(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireMember();
    const articleId = getId<ArticleId>(formData, 'articleId');
    const values = articleSchema.parse({ body: getString(formData, 'body') });
    const media = [...parseExistingMedia(formData), ...parseMediaUploads(formData, user.id)].sort(
      (left, right) => left.order - right.order,
    );

    if (media.length === 0) {
      throw new Error('게시글은 사진이나 동영상 없이 저장할 수 없습니다.');
    }

    await applicationContext().get('ArticleCommandUseCase').update({
      articleId,
      body: values.body,
      media,
      userId: user.id,
    });

    return success(articleId);
  } catch (error) {
    return toActionResult(error);
  }
}

export async function prepareArticleMediaUploads(
  input: readonly ArticleMediaUploadTargetInput[],
): Promise<ArticleMediaUploadTargetResult> {
  try {
    const user = await requireMember();
    const values = z.array(uploadTargetInputSchema).min(1).parse(input);

    for (const value of values) {
      if (value.mediaType === 'image' && value.contentType !== 'image/webp') {
        throw new Error('게시글 이미지는 WEBP 형식이어야 합니다.');
      }

      if (value.mediaType === 'video' && value.contentType !== 'video/mp4') {
        throw new Error('게시글 동영상은 MP4 형식이어야 합니다.');
      }

      if (value.thumbnail && value.thumbnail.contentType !== 'image/webp') {
        throw new Error('게시글 동영상 썸네일은 WEBP 형식이어야 합니다.');
      }
    }

    const targets = await Promise.all(
      values.map((value) =>
        applicationContext()
          .get('MediaStoragePort')
          .createUploadTarget({ ...value, userId: user.id }),
      ),
    );

    return { ok: true, targets };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : '업로드 URL을 만들지 못했습니다.',
      ok: false,
    };
  }
}

export async function cleanupArticleMediaUploads(
  objectKeys: readonly string[],
): Promise<ActionResult> {
  try {
    const user = await requireMember();

    await applicationContext().get('MediaStoragePort').deleteObjects({
      objectKeys,
      userId: user.id,
    });

    return { ok: true };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function deleteArticle(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireMember();
    const articleId = getId<ArticleId>(formData, 'articleId');

    await applicationContext().get('ArticleCommandUseCase').delete({ articleId, userId: user.id });

    return success(articleId);
  } catch (error) {
    return toActionResult(error);
  }
}

export async function toggleArticleLike(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireMember();
    const articleId = getId<ArticleId>(formData, 'articleId');

    await applicationContext()
      .get('LikeCommandUseCase')
      .toggleArticleLike({ articleId, userId: user.id });

    return success(articleId);
  } catch (error) {
    return toActionResult(error);
  }
}

export async function createComment(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireMember();
    const articleId = getId<ArticleId>(formData, 'articleId');
    const parentCommentId = getString(formData, 'parentCommentId');
    const values = commentSchema.parse({ body: getString(formData, 'body') });

    await applicationContext()
      .get('CommentCommandUseCase')
      .create(
        parentCommentId
          ? {
              articleId,
              authorUserId: user.id,
              body: values.body,
              parentCommentId: parentCommentId as CommentId,
            }
          : { articleId, authorUserId: user.id, body: values.body },
      );

    return success(articleId);
  } catch (error) {
    return toActionResult(error);
  }
}

export async function toggleCommentLike(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireMember();
    const commentId = getId<CommentId>(formData, 'commentId');
    const articleId = getOptionalId<ArticleId>(formData, 'articleId');

    await applicationContext()
      .get('LikeCommandUseCase')
      .toggleCommentLike({ commentId, userId: user.id });

    return success(articleId);
  } catch (error) {
    return toActionResult(error);
  }
}

export async function updateComment(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireMember();
    const commentId = getId<CommentId>(formData, 'commentId');
    const articleId = getOptionalId<ArticleId>(formData, 'articleId');
    const values = commentSchema.parse({ body: getString(formData, 'body') });

    await applicationContext().get('CommentCommandUseCase').update({
      commentId,
      userId: user.id,
      values,
    });

    return success(articleId);
  } catch (error) {
    return toActionResult(error);
  }
}

export async function deleteComment(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireMember();
    const commentId = getId<CommentId>(formData, 'commentId');
    const articleId = getOptionalId<ArticleId>(formData, 'articleId');

    await applicationContext().get('CommentCommandUseCase').delete({ commentId, userId: user.id });

    return success(articleId);
  } catch (error) {
    return toActionResult(error);
  }
}
