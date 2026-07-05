import { applicationContext } from '@/core/config/applicationContext';
import type { NotificationId } from '@/core/notification/model/Notification';
import { createRoute } from '@hono/zod-openapi';
import { revalidatePath } from 'next/cache';
import { Controller } from '../config/Controller';
import { requireApiRole, requireApiUser } from '../config/auth';
import { assertMutableRole, toNumericId } from '../config/apiUtils';
import {
  idParamSchema,
  membersResponseSchema,
  notificationListResponseSchema,
  notificationsQuerySchema,
  okSchema,
  updateMemberRoleBodySchema,
} from '../schemas';

const controller = Controller();

function toMemberDto(member: {
  createdAt: Date;
  displayName: string | null;
  email: string | null;
  id: number;
  lastLoginAt: Date | null;
  name: string | null;
  provider: string | null;
  role: string;
}) {
  return {
    ...member,
    createdAt: member.createdAt.toISOString(),
    lastLoginAt: member.lastLoginAt?.toISOString() ?? null,
  };
}

controller.openapi(
  createRoute({
    method: 'get',
    path: '/notifications',
    request: { query: notificationsQuerySchema },
    responses: {
      200: {
        content: { 'application/json': { schema: notificationListResponseSchema } },
        description: 'Notifications',
      },
    },
    security: [{ cookieAuth: [] }],
    tags: ['notifications'],
  }),
  async (c) => {
    const user = requireApiUser(c.get('currentUser'));
    const query = c.req.valid('query');
    const snapshot = await applicationContext().get('ListNotificationsUseCase').list({
      currentUserId: user.id,
      limit: query.limit,
      offset: query.offset,
    });

    return c.json(notificationListResponseSchema.parse(snapshot), 200);
  },
);

controller.openapi(
  createRoute({
    method: 'patch',
    path: '/notifications/{notificationId}/read',
    request: { params: idParamSchema.pick({ notificationId: true }) },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Read' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['notifications'],
  }),
  async (c) => {
    const user = requireApiUser(c.get('currentUser'));
    await applicationContext()
      .get('MarkNotificationReadUseCase')
      .markRead({
        currentUserId: user.id,
        notificationId: toNumericId<NotificationId>(c.req.valid('param').notificationId, '알림 id'),
      });
    revalidatePath('/feed');

    return c.json({ ok: true } as const, 200);
  },
);

controller.openapi(
  createRoute({
    method: 'patch',
    path: '/notifications/read-all',
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Read all' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['notifications'],
  }),
  async (c) => {
    const user = requireApiUser(c.get('currentUser'));
    await applicationContext()
      .get('MarkAllNotificationsReadUseCase')
      .markAllRead({ currentUserId: user.id });
    revalidatePath('/feed');

    return c.json({ ok: true } as const, 200);
  },
);

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
