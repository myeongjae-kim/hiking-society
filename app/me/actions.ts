'use server';

import { applicationContext } from '@/core/config/applicationContext';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireCurrentUser, setSessionCookies } from '../auth/actions/session';

export type ProfileActionState = {
  error?: string;
  ok: boolean;
};

const maxProfileImageBytes = 12 * 1024 * 1024;

const displayNameSchema = z.object({
  displayName: z.string().trim().min(1, '이름을 입력해주세요.').max(100),
});

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email('이메일 형식이 올바르지 않습니다.').max(320),
});

const imageSchema = z.object({
  removeProfileImage: z.boolean(),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function getCurrentDisplayName(user: Awaited<ReturnType<typeof requireCurrentUser>>) {
  return user.displayName ?? user.name ?? user.email ?? '회원';
}

async function parseProfileImageUpload(formData: FormData) {
  const file = formData.get('profileImage');

  if (!(file instanceof File) || file.size === 0) {
    return undefined;
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드할 수 있습니다.');
  }

  if (file.type !== 'image/webp') {
    throw new Error('프로필 이미지는 WEBP 형식이어야 합니다.');
  }

  if (file.size > maxProfileImageBytes) {
    throw new Error('프로필 이미지는 12MB 이하만 업로드할 수 있습니다.');
  }

  return {
    byteSize: file.size,
    bytes: new Uint8Array(await file.arrayBuffer()),
    contentType: file.type,
    fileName: file.name,
  };
}

function toActionResult(error: unknown): ProfileActionState {
  if (error instanceof z.ZodError) {
    return {
      error: error.issues[0]?.message ?? '입력값을 확인해주세요.',
      ok: false,
    };
  }

  return {
    error: error instanceof Error ? error.message : '프로필을 저장하지 못했습니다.',
    ok: false,
  };
}

function revalidateProfileViews() {
  revalidatePath('/me');
  revalidatePath('/feed');
  revalidatePath('/members');
}

export async function updateDisplayName(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  try {
    const user = await requireCurrentUser();
    const values = displayNameSchema.parse({
      displayName: getString(formData, 'displayName'),
    });

    await applicationContext().get('UpdateProfileUseCase').update({
      displayName: values.displayName,
      email: user.email,
      now: new Date(),
      removeProfileImage: false,
      userId: user.id,
    });

    revalidateProfileViews();

    return { ok: true };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function updateEmail(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  try {
    const user = await requireCurrentUser();
    const values = emailSchema.parse({
      email: getString(formData, 'email'),
    });

    await applicationContext()
      .get('UpdateProfileUseCase')
      .update({
        displayName: getCurrentDisplayName(user),
        email: values.email,
        now: new Date(),
        removeProfileImage: false,
        userId: user.id,
      });

    if (values.email !== user.email && user.provider) {
      await setSessionCookies({
        email: values.email,
        provider: user.provider,
        role: user.role,
        userId: user.id,
      });
    }

    revalidateProfileViews();

    return { ok: true };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function updateProfileImage(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  try {
    const user = await requireCurrentUser();
    const values = imageSchema.parse({
      removeProfileImage: getString(formData, 'removeProfileImage') === 'on',
    });
    const profileImageUpload = await parseProfileImageUpload(formData);

    if (!values.removeProfileImage && !profileImageUpload) {
      throw new Error('새 프로필 이미지를 선택해주세요.');
    }

    await applicationContext()
      .get('UpdateProfileUseCase')
      .update({
        displayName: getCurrentDisplayName(user),
        email: user.email,
        now: new Date(),
        profileImageUpload,
        removeProfileImage: values.removeProfileImage,
        userId: user.id,
      });

    revalidateProfileViews();

    return { ok: true };
  } catch (error) {
    return toActionResult(error);
  }
}
