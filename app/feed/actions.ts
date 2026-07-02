'use server';

import type { ExistingArticlePhotoInput } from '@/core/article/application/port/in/ArticleCommandUseCase';
import type { ArticleId } from '@/core/article/domain';
import type { CommentId } from '@/core/comment/domain';
import type {
  IsoDateString,
  IsoDateTimeString,
  Latitude,
  Longitude,
  Timezone,
} from '@/core/common/domain';
import { applicationContext } from '@/core/config/applicationContext';
import type { HikingId } from '@/core/hiking/domain';
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

function success(): ActionResult {
  revalidatePath('/feed');
  return { ok: true };
}

function parseHikingValues(formData: FormData) {
  const values = hikingSchema.parse({
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

async function parsePhotoUploads(formData: FormData) {
  const files = formData.getAll('photos').filter((value): value is File => value instanceof File);
  const orders = formData.getAll('photoOrders').map((value) => Number(value));

  return Promise.all(
    files.map(async (file, index) => {
      if (!file.type.startsWith('image/')) {
        throw new Error('사진 파일만 업로드할 수 있습니다.');
      }

      if (file.type !== 'image/webp') {
        throw new Error('게시글 사진은 WEBP 형식이어야 합니다.');
      }

      return {
        byteSize: file.size,
        bytes: new Uint8Array(await file.arrayBuffer()),
        contentType: file.type,
        fileName: file.name,
        order: Number.isInteger(orders[index]) ? orders[index] : index + 1,
      };
    }),
  );
}

function parseExistingPhotos(formData: FormData): ExistingArticlePhotoInput[] {
  const raw = getString(formData, 'existingPhotos');

  if (!raw) {
    return [];
  }

  const parsed = z
    .array(
      z.object({
        byteSize: z.number().optional(),
        contentType: z.string().optional(),
        objectKey: z.string().optional(),
        order: z.number().int().positive(),
        url: z.string().min(1),
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
    const photos = await parsePhotoUploads(formData);

    if (photos.length === 0) {
      throw new Error('게시글은 사진 없이 저장할 수 없습니다.');
    }

    await applicationContext().get('ArticleCommandUseCase').create({
      authorUserId: user.id,
      body: values.body,
      hikingId,
      photos,
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
    const photos = [...parseExistingPhotos(formData), ...(await parsePhotoUploads(formData))].sort(
      (left, right) => left.order - right.order,
    );

    if (photos.length === 0) {
      throw new Error('게시글은 사진 없이 저장할 수 없습니다.');
    }

    await applicationContext().get('ArticleCommandUseCase').update({
      articleId,
      body: values.body,
      photos,
      userId: user.id,
    });

    return success();
  } catch (error) {
    return toActionResult(error);
  }
}

export async function deleteArticle(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireMember();
    const articleId = getId<ArticleId>(formData, 'articleId');

    await applicationContext().get('ArticleCommandUseCase').delete({ articleId, userId: user.id });

    return success();
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

    return success();
  } catch (error) {
    return toActionResult(error);
  }
}

export async function updateComment(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireMember();
    const commentId = getId<CommentId>(formData, 'commentId');
    const values = commentSchema.parse({ body: getString(formData, 'body') });

    await applicationContext().get('CommentCommandUseCase').update({
      commentId,
      userId: user.id,
      values,
    });

    return success();
  } catch (error) {
    return toActionResult(error);
  }
}

export async function deleteComment(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireMember();
    const commentId = getId<CommentId>(formData, 'commentId');

    await applicationContext().get('CommentCommandUseCase').delete({ commentId, userId: user.id });

    return success();
  } catch (error) {
    return toActionResult(error);
  }
}
