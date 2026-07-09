import { applicationContext } from '@/core/config/applicationContext.server';
import { createRoute } from '@hono/zod-openapi';
import { revalidatePath } from '@/app/api/[...route]/config/revalidate';
import { Controller } from '@/app/api/[...route]/config/Controller';
import { assertMutableRole } from '@/app/api/[...route]/config/apiUtils';
import { requireApiRole } from '@/app/api/[...route]/config/auth';
import { idParamSchema, okSchema, updateMemberRoleBodySchema } from '@/app/api/[...route]/schemas';

const controller = Controller();

controller.openapi(
  createRoute({
    method: 'patch',
    path: '/members/{userId}/role',
    request: {
      body: {
        content: { 'application/json': { schema: updateMemberRoleBodySchema } },
        required: true,
      },
      params: idParamSchema.pick({ userId: true }),
    },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Updated' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['members'],
  }),
  async (c) => {
    const actor = requireApiRole(c.get('currentUser'), ['admin', 'member']);
    const nextRole = c.req.valid('json').role;
    assertMutableRole(nextRole);

    await applicationContext()
      .get('UpdateMemberRoleUseCase')
      .update({
        actorRole: actor.role,
        nextRole,
        now: new Date(),
        userId: Number(c.req.valid('param').userId),
      });
    revalidatePath('/members');

    return c.json({ ok: true } as const, 200);
  },
);

export default controller;
