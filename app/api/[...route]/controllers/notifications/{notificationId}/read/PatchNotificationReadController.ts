import { applicationContext } from '@/core/config/applicationContext';
import type { NotificationId } from '@/core/notification/model/Notification';
import { createRoute } from '@hono/zod-openapi';
import { revalidatePath } from 'next/cache';
import { Controller } from '@/app/api/[...route]/config/Controller';
import { toNumericId } from '@/app/api/[...route]/config/apiUtils';
import { requireApiUser } from '@/app/api/[...route]/config/auth';
import { idParamSchema, okSchema } from '@/app/api/[...route]/schemas';

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
