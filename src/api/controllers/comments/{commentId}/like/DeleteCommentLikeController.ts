import type { CommentId } from '@/core/comment/domain';
import { applicationContext } from '@/core/config/applicationContext.server';
import { createRoute } from '@hono/zod-openapi';
import { revalidatePath } from '#/api/config/revalidate';
import { Controller } from '#/api/config/Controller';
import { toNumericId } from '#/api/config/apiUtils';
import { requireApiRole } from '#/api/config/auth';
import { idParamSchema, okSchema } from '#/api/schemas';

const controller = Controller();

controller.openapi(
  createRoute({
    method: 'delete',
    path: '/comments/{commentId}/like',
    request: { params: idParamSchema.pick({ commentId: true }) },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Toggled' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['comments'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);
    await applicationContext()
      .get('LikeCommandUseCase')
      .toggleCommentLike({
        commentId: toNumericId<CommentId>(c.req.valid('param').commentId, '댓글 id'),
        userId: user.id,
      });
    revalidatePath('/feed');

    return c.json({ ok: true } as const, 200);
  },
);

export default controller;
