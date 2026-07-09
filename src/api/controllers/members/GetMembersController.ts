import { applicationContext } from '@/core/config/applicationContext.server';
import { createRoute } from '@hono/zod-openapi';
import { Controller } from '#/api/config/Controller';
import { requireApiRole } from '#/api/config/auth';
import { membersResponseSchema } from '#/api/schemas';
import { toMemberDto } from './_memberDto';

const controller = Controller();

controller.openapi(
  createRoute({
    method: 'get',
    path: '/members',
    responses: {
      200: {
        content: { 'application/json': { schema: membersResponseSchema } },
        description: 'Members',
      },
    },
    security: [{ cookieAuth: [] }],
    tags: ['members'],
  }),
  async (c) => {
    requireApiRole(c.get('currentUser'), ['admin', 'member']);
    const members = await applicationContext().get('ListMembersUseCase').list();

    return c.json(membersResponseSchema.parse({ members: members.map(toMemberDto) }), 200);
  },
);

export default controller;
