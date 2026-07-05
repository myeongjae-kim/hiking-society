import { applicationContext } from '@/core/config/applicationContext';
import { createRoute } from '@hono/zod-openapi';
import { apiErrorSchema } from '@/app/api/[...route]/config/ApiError';
import { Controller } from '@/app/api/[...route]/config/Controller';
import { notFound, toArticleId } from '@/app/api/[...route]/config/apiUtils';
import { requireApiRole } from '@/app/api/[...route]/config/auth';
import { articleDetailResponseSchema, idParamSchema } from '@/app/api/[...route]/schemas';

const controller = Controller();

controller.openapi(
  createRoute({
    method: 'get',
    path: '/articles/{articleId}',
    request: { params: idParamSchema.pick({ articleId: true }) },
    responses: {
      200: {
        content: { 'application/json': { schema: articleDetailResponseSchema } },
        description: 'Article detail',
      },
      404: {
        content: { 'application/json': { schema: apiErrorSchema } },
        description: 'Not found',
      },
    },
    security: [{ cookieAuth: [] }],
    tags: ['articles'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);
    const articleId = toArticleId(c.req.valid('param').articleId);
    const snapshot = await applicationContext()
      .get('GetArticleDetailUseCase')
      .get({ articleId, currentUserId: user.id });

    if (!snapshot) {
      throw notFound('글을 찾을 수 없습니다.');
    }

    return c.json(articleDetailResponseSchema.parse(snapshot), 200);
  },
);

export default controller;
