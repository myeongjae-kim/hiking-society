'use server';

import { revalidatePath } from 'next/cache';

import { requireCurrentUser } from '@/app/auth/actions/session';
import { applicationContext } from '@/core/config/applicationContext';
import type {
  NotificationId,
  NotificationListSnapshot,
} from '@/core/notification/model/Notification';

const NOTIFICATION_PAGE_SIZE = 20;

type ActionResult = {
  error?: string;
  ok: boolean;
};

type ListNotificationsPageActionResult =
  | {
      ok: true;
      snapshot: NotificationListSnapshot;
    }
  | {
      error?: string;
      ok: false;
    };

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function getNotificationId(formData: FormData) {
  const value = getString(formData, 'notificationId');

  if (!/^\d+$/.test(value)) {
    throw new Error('잘못된 알림 id입니다.');
  }

  return value as NotificationId;
}

function getPaginationNumber(
  formData: FormData,
  key: string,
  { max, min }: { max: number; min: number },
) {
  const value = getString(formData, key);

  if (!/^\d+$/.test(value)) {
    throw new Error('잘못된 알림 페이지 요청입니다.');
  }

  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue < min || numberValue > max) {
    throw new Error('잘못된 알림 페이지 요청입니다.');
  }

  return numberValue;
}

function getSafeCurrentPath(formData: FormData) {
  const value = getString(formData, 'currentPath');

  if (value === '/feed' || /^\/article\/\d+$/.test(value)) {
    return value;
  }

  return '/feed';
}

function toActionResult(error: unknown): ActionResult {
  return {
    error: error instanceof Error ? error.message : '요청을 처리하지 못했습니다.',
    ok: false,
  };
}

function success(currentPath: string): ActionResult {
  revalidatePath(currentPath);
  return { ok: true };
}

export async function markNotificationRead(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireCurrentUser();
    const notificationId = getNotificationId(formData);
    const currentPath = getSafeCurrentPath(formData);

    await applicationContext()
      .get('MarkNotificationReadUseCase')
      .markRead({ currentUserId: user.id, notificationId });

    return success(currentPath);
  } catch (error) {
    return toActionResult(error);
  }
}

export async function markAllNotificationsRead(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireCurrentUser();
    const currentPath = getSafeCurrentPath(formData);

    await applicationContext()
      .get('MarkAllNotificationsReadUseCase')
      .markAllRead({ currentUserId: user.id });

    return success(currentPath);
  } catch (error) {
    return toActionResult(error);
  }
}

export async function listNotificationsPage(
  formData: FormData,
): Promise<ListNotificationsPageActionResult> {
  try {
    const user = await requireCurrentUser();
    const offset = getPaginationNumber(formData, 'offset', {
      max: Number.MAX_SAFE_INTEGER,
      min: 0,
    });
    const limit = getPaginationNumber(formData, 'limit', {
      max: NOTIFICATION_PAGE_SIZE,
      min: 1,
    });

    const snapshot = await applicationContext()
      .get('ListNotificationsUseCase')
      .list({ currentUserId: user.id, limit, offset });

    return { ok: true, snapshot };
  } catch (error) {
    const result = toActionResult(error);
    return { error: result.error, ok: false };
  }
}
