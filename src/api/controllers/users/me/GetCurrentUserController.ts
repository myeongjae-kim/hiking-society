import { createRoute } from '@hono/zod-openapi';
import { apiErrorSchema } from '#/api/config/ApiError';
import { Controller } from '#/api/config/Controller';
import { requireApiUser } from '#/api/config/auth';
import { currentUserSchema } from '#/api/schemas';

const controller = Controller();

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

export default controller;
