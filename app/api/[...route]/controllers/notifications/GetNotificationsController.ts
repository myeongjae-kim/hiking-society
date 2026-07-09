import { applicationContext } from '@/core/config/applicationContext.server';
import { createRoute } from '@hono/zod-openapi';
import { Controller } from '@/app/api/[...route]/config/Controller';
import { requireApiUser } from '@/app/api/[...route]/config/auth';
import {
  notificationListResponseSchema,
  notificationsQuerySchema,
} from '@/app/api/[...route]/schemas';

const controller = Controller();

controller.openapi(
  createRoute({
    method: 'get',
    path: '/notifications',
    request: { query: notificationsQuerySchema },
    responses: {
      200: {
        content: { 'application/json': { schema: notificationListResponseSchema } },
        description: 'Notifications',
      },
    },
    security: [{ cookieAuth: [] }],
    tags: ['notifications'],
  }),
  async (c) => {
    const user = requireApiUser(c.get('currentUser'));
    const query = c.req.valid('query');
    const snapshot = await applicationContext().get('ListNotificationsUseCase').list({
      currentUserId: user.id,
      limit: query.limit,
      offset: query.offset,
    });

    return c.json(notificationListResponseSchema.parse(snapshot), 200);
  },
);

export default controller;
