import { applicationContext } from '@/core/config/applicationContext.server';
import { createRoute } from '@hono/zod-openapi';
import { revalidatePath } from '#/api/config/revalidate';
import { Controller } from '#/api/config/Controller';
import { requireApiUser } from '#/api/config/auth';
import { okSchema } from '#/api/schemas';

const controller = Controller();

controller.openapi(
  createRoute({
    method: 'patch',
    path: '/notifications/read-all',
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Read all' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['notifications'],
  }),
  async (c) => {
    const user = requireApiUser(c.get('currentUser'));
    await applicationContext()
      .get('MarkAllNotificationsReadUseCase')
      .markAllRead({ currentUserId: user.id });
    revalidatePath('/feed');

    return c.json({ ok: true } as const, 200);
  },
);

export default controller;
