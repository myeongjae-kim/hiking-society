import { applicationContext } from '@/core/config/applicationContext.server';
import type { NotificationId } from '@/core/notification/model/Notification';
import { createRoute } from '@hono/zod-openapi';
import { revalidatePath } from '#/api/config/revalidate';
import { Controller } from '#/api/config/Controller';
import { toNumericId } from '#/api/config/apiUtils';
import { requireApiUser } from '#/api/config/auth';
import { idParamSchema, okSchema } from '#/api/schemas';

const controller = Controller();

controller.openapi(
  createRoute({
    method: 'patch',
    path: '/notifications/{notificationId}/read',
    request: { params: idParamSchema.pick({ notificationId: true }) },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Read' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['notifications'],
  }),
  async (c) => {
    const user = requireApiUser(c.get('currentUser'));
    await applicationContext()
      .get('MarkNotificationReadUseCase')
      .markRead({
        currentUserId: user.id,
        notificationId: toNumericId<NotificationId>(c.req.valid('param').notificationId, '알림 id'),
      });
    revalidatePath('/feed');

    return c.json({ ok: true } as const, 200);
  },
);

export default controller;
