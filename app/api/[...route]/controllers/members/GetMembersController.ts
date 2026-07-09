import { applicationContext } from '@/core/config/applicationContext.server';
import { createRoute } from '@hono/zod-openapi';
import { Controller } from '@/app/api/[...route]/config/Controller';
import { requireApiRole } from '@/app/api/[...route]/config/auth';
import { membersResponseSchema } from '@/app/api/[...route]/schemas';
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
