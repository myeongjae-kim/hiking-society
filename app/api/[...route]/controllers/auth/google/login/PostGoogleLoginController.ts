import type { LoginWithGoogleCodeResult } from '@/core/auth/model/LoginWithGoogleCodeResult';
import { applicationContext } from '@/core/config/applicationContext';
import { createRoute } from '@hono/zod-openapi';
import { setCookie } from 'hono/cookie';
import { ApiError } from '@/app/api/[...route]/config/ApiError';
import { Controller } from '@/app/api/[...route]/config/Controller';
import { currentUserSchema, loginWithGoogleBodySchema } from '@/app/api/[...route]/schemas';
import { cookieOptions, sessionCookieConfig } from '../../../_sessionCookies';

const controller = Controller();
const {
  accessTokenCookieName,
  accessTokenMaxAgeSeconds,
  refreshTokenCookieName,
  refreshTokenMaxAgeSeconds,
} = sessionCookieConfig;

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

export default controller;
