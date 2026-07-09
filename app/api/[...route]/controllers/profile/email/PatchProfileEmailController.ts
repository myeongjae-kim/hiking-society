import { applicationContext } from '@/core/config/applicationContext.server';
import { createRoute } from '@hono/zod-openapi';
import { setCookie } from 'hono/cookie';
import { Controller } from '@/app/api/[...route]/config/Controller';
import { requireApiUser } from '@/app/api/[...route]/config/auth';
import { okSchema, updateEmailBodySchema } from '@/app/api/[...route]/schemas';
import { cookieOptions, sessionCookieConfig } from '../../_sessionCookies';
import { getCurrentDisplayName, revalidateProfileViews } from '../_helpers';

const controller = Controller();
const {
  accessTokenCookieName,
  accessTokenMaxAgeSeconds,
  refreshTokenCookieName,
  refreshTokenMaxAgeSeconds,
} = sessionCookieConfig;

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

export default controller;
