import { applicationContext } from '@/core/config/applicationContext';
import { createRoute } from '@hono/zod-openapi';
import { Controller } from '@/app/api/[...route]/config/Controller';
import { requireApiUser } from '@/app/api/[...route]/config/auth';
import {
  profileImageUploadTargetBodySchema,
  profileImageUploadTargetResponseSchema,
} from '@/app/api/[...route]/schemas';

const controller = Controller();

controller.openapi(
  createRoute({
    method: 'post',
    path: '/profile-image/upload-target',
    request: {
      body: {
        content: { 'application/json': { schema: profileImageUploadTargetBodySchema } },
        required: true,
      },
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: profileImageUploadTargetResponseSchema,
          },
        },
        description: 'Upload target',
      },
    },
    security: [{ cookieAuth: [] }],
    tags: ['profile'],
  }),
  async (c) => {
    const user = requireApiUser(c.get('currentUser'));
    const target = await applicationContext()
      .get('ProfileImageStoragePort')
      .createUploadTarget({ ...c.req.valid('json'), userId: user.id });

    return c.json(profileImageUploadTargetResponseSchema.parse(target), 200);
  },
);

export default controller;
