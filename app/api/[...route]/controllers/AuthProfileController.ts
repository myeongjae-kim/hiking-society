import type { LoginWithGoogleCodeResult } from '@/core/auth/model/LoginWithGoogleCodeResult';
import { applicationContext } from '@/core/config/applicationContext';
import { env } from '@/core/config/env';
import { createRoute } from '@hono/zod-openapi';
import { deleteCookie, setCookie } from 'hono/cookie';
import { revalidatePath } from 'next/cache';
import { ApiError, apiErrorSchema } from '../config/ApiError';
import { Controller } from '../config/Controller';
import { badRequest } from '../config/apiUtils';
import { requireApiUser } from '../config/auth';
import {
  cleanupUploadsBodySchema,
  currentUserSchema,
  loginWithGoogleBodySchema,
  okSchema,
  profileImageBodySchema,
  profileImageUploadTargetBodySchema,
  profileImageUploadTargetResponseSchema,
  updateDisplayNameBodySchema,
  updateEmailBodySchema,
} from '../schemas';

const controller = Controller();
const {
  accessTokenCookieName,
  accessTokenMaxAgeSeconds,
  refreshTokenCookieName,
  refreshTokenMaxAgeSeconds,
} = applicationContext().get('CookieConfig');

function cookieOptions(maxAge: number) {
  return applicationContext().get('GetCookieOptionsUseCase').getCookieOptions(maxAge);
}

function revalidateProfileViews() {
  revalidatePath('/me');
  revalidatePath('/feed');
  revalidatePath('/members');
}

function getCurrentDisplayName(user: ReturnType<typeof requireApiUser>) {
  return user.displayName ?? user.name ?? user.email ?? '회원';
}

function assertProfileObjectKey(objectKey: string, userId: number) {
  if (!objectKey.startsWith(`profile-images/users/${userId}/`)) {
    throw badRequest('잘못된 프로필 이미지입니다.');
  }
}

function assertPublicUrl(url: string, objectKey: string) {
  const expectedUrl = `${env.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${objectKey
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')}`;

  if (url !== expectedUrl) {
    throw badRequest('잘못된 프로필 이미지 URL입니다.');
  }
}

controller.openapi(
  createRoute({
    method: 'get',
    path: '/users/me',
    responses: {
      200: {
        content: { 'application/json': { schema: currentUserSchema } },
        description: 'Current user',
      },
      401: {
        content: { 'application/json': { schema: apiErrorSchema } },
        description: 'Unauthorized',
      },
    },
    security: [{ cookieAuth: [] }],
    tags: ['auth'],
  }),
  (c) => c.json(currentUserSchema.parse(requireApiUser(c.get('currentUser'))), 200),
);

controller.openapi(
  createRoute({
    method: 'post',
    path: '/auth/google/login',
    request: {
      body: {
        content: { 'application/json': { schema: loginWithGoogleBodySchema } },
        required: true,
      },
    },
    responses: {
      200: {
        content: { 'application/json': { schema: currentUserSchema } },
        description: 'Logged in user',
      },
    },
    tags: ['auth'],
  }),
  async (c) => {
    let result: LoginWithGoogleCodeResult;

    try {
      result = await applicationContext()
        .get('LoginWithGoogleCodeUseCase')
        .login({ code: c.req.valid('json').code, now: new Date() });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';

      if (message === 'invalid_grant') {
        throw new ApiError({
          error: 'GOOGLE_LOGIN_FAILED',
          message: 'Google 로그인 코드가 올바르지 않거나 만료되었습니다. 다시 시도해주세요.',
          status: 400,
        });
      }

      throw error;
    }
    const { accessToken, refreshToken } = await applicationContext()
      .get('CreateSessionTokenUseCase')
      .create(result.session);

    setCookie(c, accessTokenCookieName, accessToken, cookieOptions(accessTokenMaxAgeSeconds));
    setCookie(c, refreshTokenCookieName, refreshToken, cookieOptions(refreshTokenMaxAgeSeconds));

    return c.json(currentUserSchema.parse(result.user), 200);
  },
);

controller.openapi(
  createRoute({
    method: 'post',
    path: '/auth/logout',
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Logged out' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['auth'],
  }),
  (c) => {
    deleteCookie(c, accessTokenCookieName, { path: '/' });
    deleteCookie(c, refreshTokenCookieName, { path: '/' });
    return c.json({ ok: true } as const, 200);
  },
);

controller.openapi(
  createRoute({
    method: 'patch',
    path: '/profile/display-name',
    request: {
      body: {
        content: { 'application/json': { schema: updateDisplayNameBodySchema } },
        required: true,
      },
    },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Updated' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['profile'],
  }),
  async (c) => {
    const user = requireApiUser(c.get('currentUser'));
    const values = c.req.valid('json');

    await applicationContext().get('UpdateProfileUseCase').update({
      displayName: values.displayName,
      email: user.email,
      now: new Date(),
      removeProfileImage: false,
      userId: user.id,
    });
    revalidateProfileViews();

    return c.json({ ok: true } as const, 200);
  },
);

controller.openapi(
  createRoute({
    method: 'patch',
    path: '/profile/email',
    request: {
      body: { content: { 'application/json': { schema: updateEmailBodySchema } }, required: true },
    },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Updated' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['profile'],
  }),
  async (c) => {
    const user = requireApiUser(c.get('currentUser'));
    const values = c.req.valid('json');

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
      const { accessToken, refreshToken } = await applicationContext()
        .get('CreateSessionTokenUseCase')
        .create({ email: values.email, provider: user.provider, role: user.role, userId: user.id });

      setCookie(c, accessTokenCookieName, accessToken, cookieOptions(accessTokenMaxAgeSeconds));
      setCookie(c, refreshTokenCookieName, refreshToken, cookieOptions(refreshTokenMaxAgeSeconds));
    }

    revalidateProfileViews();

    return c.json({ ok: true } as const, 200);
  },
);

controller.openapi(
  createRoute({
    method: 'patch',
    path: '/profile/image',
    request: {
      body: { content: { 'application/json': { schema: profileImageBodySchema } }, required: true },
    },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Updated' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['profile'],
  }),
  async (c) => {
    const user = requireApiUser(c.get('currentUser'));
    const values = c.req.valid('json');

    if (!values.removeProfileImage && !values.profileImage) {
      throw badRequest('새 프로필 이미지를 선택해주세요.');
    }

    if (values.profileImage) {
      assertProfileObjectKey(values.profileImage.objectKey, user.id);
      assertPublicUrl(values.profileImage.url, values.profileImage.objectKey);
    }

    await applicationContext()
      .get('UpdateProfileUseCase')
      .update({
        displayName: getCurrentDisplayName(user),
        email: user.email,
        now: new Date(),
        profileImage: values.profileImage,
        removeProfileImage: values.removeProfileImage,
        userId: user.id,
      });
    revalidateProfileViews();

    return c.json({ ok: true } as const, 200);
  },
);

controller.openapi(
  createRoute({
    method: 'post',
    path: '/profile-image/upload-target',
    request: {
      body: {
        content: { 'application/json': { schema: profileImageUploadTargetBodySchema } },
        required: true,
      },
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: profileImageUploadTargetResponseSchema,
          },
        },
        description: 'Upload target',
      },
    },
    security: [{ cookieAuth: [] }],
    tags: ['profile'],
  }),
  async (c) => {
    const user = requireApiUser(c.get('currentUser'));
    const target = await applicationContext()
      .get('ProfileImageStoragePort')
      .createUploadTarget({ ...c.req.valid('json'), userId: user.id });

    return c.json(profileImageUploadTargetResponseSchema.parse(target), 200);
  },
);

controller.openapi(
  createRoute({
    method: 'delete',
    path: '/profile-image/uploads',
    request: {
      body: {
        content: { 'application/json': { schema: cleanupUploadsBodySchema } },
        required: true,
      },
    },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Cleaned' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['profile'],
  }),
  async (c) => {
    const user = requireApiUser(c.get('currentUser'));
    await applicationContext()
      .get('ProfileImageStoragePort')
      .deleteObjects({ objectKeys: c.req.valid('json').objectKeys, userId: user.id });
    return c.json({ ok: true } as const, 200);
  },
);

export default controller;
