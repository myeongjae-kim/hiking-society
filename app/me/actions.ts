'use server';

import { applicationContext } from '@/core/config/applicationContext';
import { env } from '@/core/config/env';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireCurrentUser, setSessionCookies } from '../auth/actions/session';

export type ProfileActionState = {
  error?: string;
  ok: boolean;
};

const maxProfileImageBytes = 12 * 1024 * 1024;

export type ProfileImageUploadTargetInput = {
  byteSize: number;
  contentType: string;
  fileName: string;
};

export type ProfileImageUploadTargetResult =
  | {
      error?: string;
      ok: false;
    }
  | {
      objectKey: string;
      ok: true;
      uploadUrl: string;
      url: string;
    };

const displayNameSchema = z.object({
  displayName: z.string().trim().min(1, '이름을 입력해주세요.').max(100),
});

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email('이메일 형식이 올바르지 않습니다.').max(320),
});

const imageSchema = z.object({
  removeProfileImage: z.boolean(),
});
const profileImageUploadTargetSchema = z.object({
  byteSize: z.number().int().positive().max(maxProfileImageBytes),
  contentType: z.literal('image/webp'),
  fileName: z.string().trim().min(1).max(255),
});
const uploadedProfileImageSchema = z.object({
  byteSize: z.number().int().positive().max(maxProfileImageBytes),
  contentType: z.literal('image/webp'),
  objectKey: z.string().trim().min(1).max(1024),
  url: z.string().url(),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function getCurrentDisplayName(user: Awaited<ReturnType<typeof requireCurrentUser>>) {
  return user.displayName ?? user.name ?? user.email ?? '회원';
}

function assertProfileObjectKey(objectKey: string, userId: number) {
  if (!objectKey.startsWith(`profile-images/users/${userId}/`)) {
    throw new Error('잘못된 프로필 이미지입니다.');
  }
}

function assertPublicUrl(url: string, objectKey: string) {
  const expectedUrl = `${env.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${objectKey
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')}`;

  if (url !== expectedUrl) {
    throw new Error('잘못된 프로필 이미지 URL입니다.');
  }
}

function parseUploadedProfileImage(formData: FormData, userId: number) {
  const raw = getString(formData, 'profileImage');

  if (!raw) {
    return undefined;
  }

  const profileImage = uploadedProfileImageSchema.parse(JSON.parse(raw));
  assertProfileObjectKey(profileImage.objectKey, userId);
  assertPublicUrl(profileImage.url, profileImage.objectKey);

  return profileImage;
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
    const profileImage = parseUploadedProfileImage(formData, user.id);

    if (!values.removeProfileImage && !profileImage) {
      throw new Error('새 프로필 이미지를 선택해주세요.');
    }

    await applicationContext()
      .get('UpdateProfileUseCase')
      .update({
        displayName: getCurrentDisplayName(user),
        email: user.email,
        now: new Date(),
        profileImage,
        removeProfileImage: values.removeProfileImage,
        userId: user.id,
      });

    revalidateProfileViews();

    return { ok: true };
  } catch (error) {
    return toActionResult(error);
  }
}

export async function prepareProfileImageUpload(
  input: ProfileImageUploadTargetInput,
): Promise<ProfileImageUploadTargetResult> {
  try {
    const user = await requireCurrentUser();
    const values = profileImageUploadTargetSchema.parse(input);
    const target = await applicationContext()
      .get('ProfileImageStoragePort')
      .createUploadTarget({ ...values, userId: user.id });

    return { ok: true, ...target };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : '업로드 URL을 만들지 못했습니다.',
      ok: false,
    };
  }
}

export async function cleanupProfileImageUploads(
  objectKeys: readonly string[],
): Promise<ProfileActionState> {
  try {
    const user = await requireCurrentUser();

    await applicationContext().get('ProfileImageStoragePort').deleteObjects({
      objectKeys,
      userId: user.id,
    });

    return { ok: true };
  } catch (error) {
    return toActionResult(error);
  }
}
