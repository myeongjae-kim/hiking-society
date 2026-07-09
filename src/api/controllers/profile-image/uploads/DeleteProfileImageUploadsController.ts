import { applicationContext } from '@/core/config/applicationContext.server';
import { createRoute } from '@hono/zod-openapi';
import { Controller } from '#/api/config/Controller';
import { requireApiUser } from '#/api/config/auth';
import { cleanupUploadsBodySchema, okSchema } from '#/api/schemas';

const controller = Controller();

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
