'use server';

import type {
  ArticleMediaUpload,
  ExistingArticleMediaInput,
} from '@/core/article/application/port/in/ArticleCommandUseCase';
import type { ArticleId } from '@/core/article/domain';
import type { CommentId } from '@/core/comment/domain';
import type {
  Altitude,
  IsoDateString,
  IsoDateTimeString,
  Latitude,
  Longitude,
  Timezone,
} from '@/core/common/domain';
import { applicationContext } from '@/core/config/applicationContext';
import type { HikingId } from '@/core/hiking/domain';
import { sanitizeOriginalPhotoMetadata } from '@/app/common/utils/photoMetadata';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireCurrentUser } from '../auth/actions/session';

type ActionResult = {
  error?: string;
  ok: boolean;
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

function parseOriginalMetadata(value: unknown) {
  if (typeof value !== 'string' || value === '') {
    return null;
  }

  return sanitizeOriginalPhotoMetadata(originalMetadataSchema.parse(JSON.parse(value)));
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

async function parseMediaUploads(formData: FormData): Promise<ArticleMediaUpload[]> {
  const files = formData.getAll('media').filter((value): value is File => value instanceof File);
  const orders = formData.getAll('mediaOrders').map((value) => Number(value));
  const mediaTypes = formData.getAll('mediaTypes').map((value) => String(value));
  const durationMsValues = formData.getAll('mediaDurationMs').map((value) => Number(value));
  const widthValues = formData.getAll('mediaWidths').map((value) => Number(value));
  const heightValues = formData.getAll('mediaHeights').map((value) => Number(value));
  const metadataValues = formData.getAll('mediaMetadata');

  return Promise.all(
    files.map(async (file, index) => {
      const rawMediaType = mediaTypes[index];
      const order = Number.isInteger(orders[index]) ? orders[index] : index + 1;
      const rawThumbnail = formData.get(`mediaThumbnail-${order}`);
      const thumbnail = rawThumbnail instanceof File && rawThumbnail.size > 0 ? rawThumbnail : null;

      if (rawMediaType !== 'image' && rawMediaType !== 'video') {
        throw new Error('지원하지 않는 사진이나 동영상 형식입니다.');
      }

      const mediaType: ArticleMediaUpload['mediaType'] =
        rawMediaType === 'video' ? 'video' : 'image';

      if (mediaType === 'image' && file.type !== 'image/webp') {
        throw new Error('게시글 이미지는 WEBP 형식이어야 합니다.');
      }

      if (mediaType === 'video' && file.type !== 'video/mp4') {
        throw new Error('게시글 동영상은 MP4 형식이어야 합니다.');
      }

      if (mediaType === 'video' && thumbnail?.type !== 'image/webp') {
        throw new Error('게시글 동영상 썸네일은 WEBP 형식이어야 합니다.');
      }

      return {
        byteSize: file.size,
        bytes: new Uint8Array(await file.arrayBuffer()),
        contentType: file.type,
        durationMs:
          Number.isFinite(durationMsValues[index]) && durationMsValues[index] > 0
            ? durationMsValues[index]
            : null,
        fileName: file.name,
        height:
          Number.isFinite(heightValues[index]) && heightValues[index] > 0
            ? heightValues[index]
            : null,
        mediaType,
        originalMetadata: parseOriginalMetadata(metadataValues[index]),
        order,
        thumbnailUpload: thumbnail
          ? {
              byteSize: thumbnail.size,
              bytes: new Uint8Array(await thumbnail.arrayBuffer()),
              contentType: thumbnail.type,
              fileName: thumbnail.name,
            }
          : undefined,
        width:
          Number.isFinite(widthValues[index]) && widthValues[index] > 0 ? widthValues[index] : null,
      };
    }),
  );
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
    const media = await parseMediaUploads(formData);

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
    const media = [...parseExistingMedia(formData), ...(await parseMediaUploads(formData))].sort(
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
