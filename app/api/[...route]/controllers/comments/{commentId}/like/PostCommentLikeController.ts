import type { CommentId } from '@/core/comment/domain';
import { applicationContext } from '@/core/config/applicationContext.server';
import { createRoute } from '@hono/zod-openapi';
import { revalidatePath } from '@/app/api/[...route]/config/revalidate';
import { Controller } from '@/app/api/[...route]/config/Controller';
import { toNumericId } from '@/app/api/[...route]/config/apiUtils';
import { requireApiRole } from '@/app/api/[...route]/config/auth';
import { idParamSchema, okSchema } from '@/app/api/[...route]/schemas';

const controller = Controller();

controller.openapi(
  createRoute({
    method: 'post',
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
