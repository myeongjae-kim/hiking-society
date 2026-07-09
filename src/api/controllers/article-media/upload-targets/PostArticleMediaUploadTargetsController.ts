import { applicationContext } from '@/core/config/applicationContext.server';
import { createRoute } from '@hono/zod-openapi';
import { Controller } from '#/api/config/Controller';
import { requireApiRole } from '#/api/config/auth';
import {
  articleMediaUploadTargetsBodySchema,
  articleMediaUploadTargetsResponseSchema,
} from '#/api/schemas';

const controller = Controller();

controller.openapi(
  createRoute({
    method: 'post',
    path: '/article-media/upload-targets',
    request: {
      body: {
        content: { 'application/json': { schema: articleMediaUploadTargetsBodySchema } },
        required: true,
      },
    },
    responses: {
      200: {
        content: { 'application/json': { schema: articleMediaUploadTargetsResponseSchema } },
        description: 'Upload targets',
      },
    },
    security: [{ cookieAuth: [] }],
    tags: ['articles'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);
    const targets = await Promise.all(
      c.req.valid('json').map((value) =>
        applicationContext()
          .get('MediaStoragePort')
          .createUploadTarget({ ...value, userId: user.id }),
      ),
    );

    return c.json(articleMediaUploadTargetsResponseSchema.parse({ targets }), 200);
  },
);

export default controller;
