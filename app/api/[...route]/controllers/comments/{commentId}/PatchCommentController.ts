import type { CommentId } from '@/core/comment/domain';
import { applicationContext } from '@/core/config/applicationContext';
import { createRoute } from '@hono/zod-openapi';
import { revalidatePath } from '@/app/api/[...route]/config/revalidate';
import { Controller } from '@/app/api/[...route]/config/Controller';
import { toNumericId } from '@/app/api/[...route]/config/apiUtils';
import { requireApiRole } from '@/app/api/[...route]/config/auth';
import { commentBodySchema, idParamSchema, okSchema } from '@/app/api/[...route]/schemas';

const controller = Controller();

controller.openapi(
  createRoute({
    method: 'patch',
    path: '/comments/{commentId}',
    request: {
      body: {
        content: { 'application/json': { schema: commentBodySchema.pick({ body: true }) } },
        required: true,
      },
      params: idParamSchema.pick({ commentId: true }),
    },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Updated' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['comments'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);

    await applicationContext()
      .get('CommentCommandUseCase')
      .update({
        commentId: toNumericId<CommentId>(c.req.valid('param').commentId, '댓글 id'),
        userId: user.id,
        values: { body: c.req.valid('json').body },
      });
    revalidatePath('/feed');

    return c.json({ ok: true } as const, 200);
  },
);

export default controller;
