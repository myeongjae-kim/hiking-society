import { applicationContext } from '@/core/config/applicationContext.server';
import { createRoute } from '@hono/zod-openapi';
import { revalidatePath } from '@/app/api/[...route]/config/revalidate';
import { Controller } from '@/app/api/[...route]/config/Controller';
import { requireApiRole } from '@/app/api/[...route]/config/auth';
import { toHikingValues } from '@/app/api/[...route]/config/apiUtils';
import { hikingBodySchema, okSchema } from '@/app/api/[...route]/schemas';

const controller = Controller();

controller.openapi(
  createRoute({
    method: 'post',
    path: '/hikings',
    request: {
      body: { content: { 'application/json': { schema: hikingBodySchema } }, required: true },
    },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Created' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['hikings'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);
    const values = toHikingValues(c.req.valid('json'));

    await applicationContext()
      .get('HikingCommandUseCase')
      .create({
        ...values,
        authorUserId: user.id,
      });
    revalidatePath('/feed');

    return c.json({ ok: true } as const, 200);
  },
);

export default controller;
