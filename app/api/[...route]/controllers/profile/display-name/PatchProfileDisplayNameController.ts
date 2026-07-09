import { applicationContext } from '@/core/config/applicationContext.server';
import { createRoute } from '@hono/zod-openapi';
import { Controller } from '@/app/api/[...route]/config/Controller';
import { requireApiUser } from '@/app/api/[...route]/config/auth';
import { okSchema, updateDisplayNameBodySchema } from '@/app/api/[...route]/schemas';
import { revalidateProfileViews } from '../_helpers';

const controller = Controller();

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

export default controller;
