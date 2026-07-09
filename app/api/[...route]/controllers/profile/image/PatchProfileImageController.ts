import { applicationContext } from '@/core/config/applicationContext.server';
import { createRoute } from '@hono/zod-openapi';
import { Controller } from '@/app/api/[...route]/config/Controller';
import { badRequest } from '@/app/api/[...route]/config/apiUtils';
import { requireApiUser } from '@/app/api/[...route]/config/auth';
import { okSchema, profileImageBodySchema } from '@/app/api/[...route]/schemas';
import { assertProfileImage, getCurrentDisplayName, revalidateProfileViews } from '../_helpers';

const controller = Controller();

controller.openapi(
  createRoute({
    method: 'patch',
    path: '/profile/image',
    request: {
      body: { content: { 'application/json': { schema: profileImageBodySchema } }, required: true },
    },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Updated' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['profile'],
  }),
  async (c) => {
    const user = requireApiUser(c.get('currentUser'));
    const values = c.req.valid('json');

    if (!values.removeProfileImage && !values.profileImage) {
      throw badRequest('새 프로필 이미지를 선택해주세요.');
    }

    assertProfileImage(values.profileImage, user.id);

    await applicationContext()
      .get('UpdateProfileUseCase')
      .update({
        displayName: getCurrentDisplayName(user),
        email: user.email,
        now: new Date(),
        profileImage: values.profileImage,
        removeProfileImage: values.removeProfileImage,
        userId: user.id,
      });
    revalidateProfileViews();

    return c.json({ ok: true } as const, 200);
  },
);

export default controller;
