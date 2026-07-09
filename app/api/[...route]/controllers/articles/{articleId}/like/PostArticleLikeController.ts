import { applicationContext } from '@/core/config/applicationContext.server';
import { createRoute } from '@hono/zod-openapi';
import { Controller } from '@/app/api/[...route]/config/Controller';
import { toArticleId } from '@/app/api/[...route]/config/apiUtils';
import { requireApiRole } from '@/app/api/[...route]/config/auth';
import { idParamSchema, okSchema } from '@/app/api/[...route]/schemas';
import { revalidateArticleSuccess } from '../../_helpers';

const controller = Controller();

controller.openapi(
  createRoute({
    method: 'post',
    path: '/articles/{articleId}/like',
    request: { params: idParamSchema.pick({ articleId: true }) },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Toggled' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['articles'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);
    const articleId = toArticleId(c.req.valid('param').articleId);

    await applicationContext().get('LikeCommandUseCase').toggleArticleLike({
      articleId,
      userId: user.id,
    });
    revalidateArticleSuccess(articleId);

    return c.json({ ok: true } as const, 200);
  },
);

export default controller;
