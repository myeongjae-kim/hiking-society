import { applicationContext } from '@/core/config/applicationContext.server';
import { createRoute } from '@hono/zod-openapi';
import { apiErrorSchema } from '#/api/config/ApiError';
import { Controller } from '#/api/config/Controller';
import { requireApiRole } from '#/api/config/auth';
import { feedResponseSchema } from '#/api/schemas';

const controller = Controller();

controller.openapi(
  createRoute({
    method: 'get',
    path: '/feed',
    responses: {
      200: { content: { 'application/json': { schema: feedResponseSchema } }, description: 'Feed' },
      401: {
        content: { 'application/json': { schema: apiErrorSchema } },
        description: 'Unauthorized',
      },
    },
    security: [{ cookieAuth: [] }],
    tags: ['feed'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);
    const snapshot = await applicationContext().get('ListFeedUseCase').listHikings({
      currentUserId: user.id,
    });

    return c.json(feedResponseSchema.parse(snapshot), 200);
  },
);

export default controller;
