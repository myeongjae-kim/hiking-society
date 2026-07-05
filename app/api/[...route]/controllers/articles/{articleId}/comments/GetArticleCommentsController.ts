import { applicationContext } from '@/core/config/applicationContext';
import { createRoute } from '@hono/zod-openapi';
import { Controller } from '@/app/api/[...route]/config/Controller';
import { toArticleId } from '@/app/api/[...route]/config/apiUtils';
import { requireApiRole } from '@/app/api/[...route]/config/auth';
import { commentsResponseSchema, idParamSchema } from '@/app/api/[...route]/schemas';

const controller = Controller();

controller.openapi(
  createRoute({
    method: 'get',
    path: '/articles/{articleId}/comments',
    request: { params: idParamSchema.pick({ articleId: true }) },
    responses: {
      200: {
        content: { 'application/json': { schema: commentsResponseSchema } },
        description: 'Comments',
      },
    },
    security: [{ cookieAuth: [] }],
    tags: ['comments'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);
    const comments = await applicationContext()
      .get('ListArticleCommentsUseCase')
      .listArticleComments({
        articleId: toArticleId(c.req.valid('param').articleId),
        currentUserId: user.id,
      });

    return c.json(commentsResponseSchema.parse({ comments }), 200);
  },
);

export default controller;
