import type { CommentId } from '@/core/comment/domain';
import { applicationContext } from '@/core/config/applicationContext.server';
import { createRoute } from '@hono/zod-openapi';
import { Controller } from '#/api/config/Controller';
import { toArticleId } from '#/api/config/apiUtils';
import { requireApiRole } from '#/api/config/auth';
import { commentBodySchema, idParamSchema, okSchema } from '#/api/schemas';
import { revalidateArticleSuccess } from '../../_helpers';

const controller = Controller();

controller.openapi(
  createRoute({
    method: 'post',
    path: '/articles/{articleId}/comments',
    request: {
      body: { content: { 'application/json': { schema: commentBodySchema } }, required: true },
      params: idParamSchema.pick({ articleId: true }),
    },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Created' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['comments'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);
    const articleId = toArticleId(c.req.valid('param').articleId);
    const values = c.req.valid('json');

    await applicationContext()
      .get('CommentCommandUseCase')
      .create(
        values.parentCommentId
          ? {
              articleId,
              authorUserId: user.id,
              body: values.body,
              parentCommentId: values.parentCommentId as CommentId,
            }
          : { articleId, authorUserId: user.id, body: values.body },
      );
    revalidateArticleSuccess(articleId);

    return c.json({ ok: true } as const, 200);
  },
);

export default controller;
