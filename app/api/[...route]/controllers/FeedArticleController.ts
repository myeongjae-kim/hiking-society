import type { ArticleId } from '@/core/article/domain';
import type { CommentId } from '@/core/comment/domain';
import { applicationContext } from '@/core/config/applicationContext';
import { env } from '@/core/config/env';
import type { HikingId } from '@/core/hiking/domain';
import { createRoute, z } from '@hono/zod-openapi';
import { revalidatePath } from 'next/cache';
import { apiErrorSchema } from '../config/ApiError';
import { Controller } from '../config/Controller';
import { requireApiRole } from '../config/auth';
import {
  badRequest,
  notFound,
  successRevalidationPaths,
  toArticleId,
  toArticleMedia,
  toHikingId,
  toHikingValues,
  toNumericId,
} from '../config/apiUtils';
import {
  articleBodySchema,
  articleDetailResponseSchema,
  articleMediaUploadTargetsBodySchema,
  articleMediaUploadTargetsResponseSchema,
  cleanupUploadsBodySchema,
  commentBodySchema,
  commentsResponseSchema,
  feedResponseSchema,
  hikingArticlesResponseSchema,
  hikingBodySchema,
  idParamSchema,
  okSchema,
} from '../schemas';

const controller = Controller();

function revalidateSuccess(articleId?: ArticleId | null) {
  for (const path of successRevalidationPaths(articleId)) {
    revalidatePath(path);
  }
}

function assertArticleObjectKey(objectKey: string, userId: number) {
  if (!objectKey.startsWith(`article-media/users/${userId}/`)) {
    throw badRequest('잘못된 업로드 파일입니다.');
  }
}

function assertPublicUrl(url: string, objectKey: string) {
  const expectedUrl = `${env.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${objectKey
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')}`;

  if (url !== expectedUrl) {
    throw badRequest('잘못된 업로드 URL입니다.');
  }
}

function assertArticleUploadPublicUrl(url: string, userId: number) {
  const expectedPrefix = `${env.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/article-media/users/${userId}/`;

  if (!url.startsWith(expectedPrefix)) {
    throw badRequest('잘못된 업로드 URL입니다.');
  }
}

function validateUploadedMedia(
  userId: number,
  media: Readonly<z.infer<typeof articleBodySchema>['uploadedMedia']>,
) {
  for (const item of media) {
    assertArticleObjectKey(item.objectKey, userId);
    assertPublicUrl(item.url, item.objectKey);

    if (item.thumbnailUrl) {
      assertArticleUploadPublicUrl(item.thumbnailUrl, userId);
    }
  }
}

controller.openapi(
  createRoute({
    method: 'get',
    path: '/feed',
    responses: {
      200: { content: { 'application/json': { schema: feedResponseSchema } }, description: 'Feed' },
      401: {
        content: { 'application/json': { schema: apiErrorSchema } },
        description: 'Unauthorized',
      },
    },
    security: [{ cookieAuth: [] }],
    tags: ['feed'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);
    const snapshot = await applicationContext().get('ListFeedUseCase').listHikings({
      currentUserId: user.id,
    });

    return c.json(feedResponseSchema.parse(snapshot), 200);
  },
);

controller.openapi(
  createRoute({
    method: 'get',
    path: '/feed/hikings/{hikingId}/articles',
    request: { params: idParamSchema.pick({ hikingId: true }) },
    responses: {
      200: {
        content: { 'application/json': { schema: hikingArticlesResponseSchema } },
        description: 'Hiking articles',
      },
    },
    security: [{ cookieAuth: [] }],
    tags: ['feed'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);
    const snapshot = await applicationContext()
      .get('ListFeedUseCase')
      .listHikingArticles({
        currentUserId: user.id,
        hikingId: toHikingId(c.req.valid('param').hikingId),
      });

    return c.json(hikingArticlesResponseSchema.parse(snapshot), 200);
  },
);

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

controller.openapi(
  createRoute({
    method: 'patch',
    path: '/hikings/{hikingId}',
    request: {
      body: { content: { 'application/json': { schema: hikingBodySchema } }, required: true },
      params: idParamSchema.pick({ hikingId: true }),
    },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Updated' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['hikings'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);

    await applicationContext()
      .get('HikingCommandUseCase')
      .update({
        hikingId: toHikingId(c.req.valid('param').hikingId),
        userId: user.id,
        values: toHikingValues(c.req.valid('json')),
      });
    revalidatePath('/feed');

    return c.json({ ok: true } as const, 200);
  },
);

controller.openapi(
  createRoute({
    method: 'delete',
    path: '/hikings/{hikingId}',
    request: { params: idParamSchema.pick({ hikingId: true }) },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Deleted' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['hikings'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);

    await applicationContext()
      .get('HikingCommandUseCase')
      .delete({ hikingId: toHikingId(c.req.valid('param').hikingId), userId: user.id });
    revalidatePath('/feed');

    return c.json({ ok: true } as const, 200);
  },
);

controller.openapi(
  createRoute({
    method: 'post',
    path: '/articles',
    request: {
      body: {
        content: {
          'application/json': {
            schema: articleBodySchema.extend({ hikingId: z.string().regex(/^\d+$/) }),
          },
        },
        required: true,
      },
    },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Created' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['articles'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);
    const values = c.req.valid('json');

    validateUploadedMedia(user.id, values.uploadedMedia);
    await applicationContext()
      .get('ArticleCommandUseCase')
      .create({
        authorUserId: user.id,
        body: values.body,
        hikingId: values.hikingId as HikingId,
        media: values.uploadedMedia,
      });
    revalidateSuccess();

    return c.json({ ok: true } as const, 200);
  },
);

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
      throw notFound('게시글을 찾을 수 없습니다.');
    }

    return c.json(articleDetailResponseSchema.parse(snapshot), 200);
  },
);

controller.openapi(
  createRoute({
    method: 'patch',
    path: '/articles/{articleId}',
    request: {
      body: { content: { 'application/json': { schema: articleBodySchema } }, required: true },
      params: idParamSchema.pick({ articleId: true }),
    },
    responses: {
      200: {
        content: { 'application/json': { schema: articleDetailResponseSchema } },
        description: 'Updated article detail',
      },
    },
    security: [{ cookieAuth: [] }],
    tags: ['articles'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);
    const articleId = toArticleId(c.req.valid('param').articleId);
    const values = c.req.valid('json');

    validateUploadedMedia(user.id, values.uploadedMedia);
    await applicationContext()
      .get('ArticleCommandUseCase')
      .update({
        articleId,
        body: values.body,
        media: toArticleMedia(values),
        userId: user.id,
      });
    revalidateSuccess(articleId);

    const snapshot = await applicationContext()
      .get('GetArticleDetailUseCase')
      .get({ articleId, currentUserId: user.id });

    if (!snapshot) {
      throw notFound('게시글을 찾을 수 없습니다.');
    }

    return c.json(articleDetailResponseSchema.parse(snapshot), 200);
  },
);

controller.openapi(
  createRoute({
    method: 'delete',
    path: '/articles/{articleId}',
    request: { params: idParamSchema.pick({ articleId: true }) },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Deleted' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['articles'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);
    const articleId = toArticleId(c.req.valid('param').articleId);

    await applicationContext().get('ArticleCommandUseCase').delete({ articleId, userId: user.id });
    revalidateSuccess(articleId);

    return c.json({ ok: true } as const, 200);
  },
);

for (const method of ['post', 'delete'] as const) {
  controller.openapi(
    createRoute({
      method,
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
      revalidateSuccess(articleId);

      return c.json({ ok: true } as const, 200);
    },
  );
}

controller.openapi(
  createRoute({
    method: 'post',
    path: '/article-media/upload-targets',
    request: {
      body: {
        content: { 'application/json': { schema: articleMediaUploadTargetsBodySchema } },
        required: true,
      },
    },
    responses: {
      200: {
        content: { 'application/json': { schema: articleMediaUploadTargetsResponseSchema } },
        description: 'Upload targets',
      },
    },
    security: [{ cookieAuth: [] }],
    tags: ['articles'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);
    const targets = await Promise.all(
      c.req.valid('json').map((value) =>
        applicationContext()
          .get('MediaStoragePort')
          .createUploadTarget({ ...value, userId: user.id }),
      ),
    );

    return c.json(articleMediaUploadTargetsResponseSchema.parse({ targets }), 200);
  },
);

controller.openapi(
  createRoute({
    method: 'delete',
    path: '/article-media/uploads',
    request: {
      body: {
        content: { 'application/json': { schema: cleanupUploadsBodySchema } },
        required: true,
      },
    },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Cleaned' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['articles'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);
    await applicationContext()
      .get('MediaStoragePort')
      .deleteObjects({ objectKeys: c.req.valid('json').objectKeys, userId: user.id });
    return c.json({ ok: true } as const, 200);
  },
);

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

controller.openapi(
  createRoute({
    method: 'post',
    path: '/articles/{articleId}/comments',
    request: {
      body: { content: { 'application/json': { schema: commentBodySchema } }, required: true },
      params: idParamSchema.pick({ articleId: true }),
    },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Created' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['comments'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);
    const articleId = toArticleId(c.req.valid('param').articleId);
    const values = c.req.valid('json');

    await applicationContext()
      .get('CommentCommandUseCase')
      .create(
        values.parentCommentId
          ? {
              articleId,
              authorUserId: user.id,
              body: values.body,
              parentCommentId: values.parentCommentId as CommentId,
            }
          : { articleId, authorUserId: user.id, body: values.body },
      );
    revalidateSuccess(articleId);

    return c.json({ ok: true } as const, 200);
  },
);

controller.openapi(
  createRoute({
    method: 'patch',
    path: '/comments/{commentId}',
    request: {
      body: {
        content: { 'application/json': { schema: commentBodySchema.pick({ body: true }) } },
        required: true,
      },
      params: idParamSchema.pick({ commentId: true }),
    },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Updated' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['comments'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);

    await applicationContext()
      .get('CommentCommandUseCase')
      .update({
        commentId: toNumericId<CommentId>(c.req.valid('param').commentId, '댓글 id'),
        userId: user.id,
        values: { body: c.req.valid('json').body },
      });
    revalidatePath('/feed');

    return c.json({ ok: true } as const, 200);
  },
);

controller.openapi(
  createRoute({
    method: 'delete',
    path: '/comments/{commentId}',
    request: { params: idParamSchema.pick({ commentId: true }) },
    responses: {
      200: { content: { 'application/json': { schema: okSchema } }, description: 'Deleted' },
    },
    security: [{ cookieAuth: [] }],
    tags: ['comments'],
  }),
  async (c) => {
    const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);

    await applicationContext()
      .get('CommentCommandUseCase')
      .delete({
        commentId: toNumericId<CommentId>(c.req.valid('param').commentId, '댓글 id'),
        userId: user.id,
      });
    revalidatePath('/feed');

    return c.json({ ok: true } as const, 200);
  },
);

for (const method of ['post', 'delete'] as const) {
  controller.openapi(
    createRoute({
      method,
      path: '/comments/{commentId}/like',
      request: { params: idParamSchema.pick({ commentId: true }) },
      responses: {
        200: { content: { 'application/json': { schema: okSchema } }, description: 'Toggled' },
      },
      security: [{ cookieAuth: [] }],
      tags: ['comments'],
    }),
    async (c) => {
      const user = requireApiRole(c.get('currentUser'), ['admin', 'member']);
      await applicationContext()
        .get('LikeCommandUseCase')
        .toggleCommentLike({
          commentId: toNumericId<CommentId>(c.req.valid('param').commentId, '댓글 id'),
          userId: user.id,
        });
      revalidatePath('/feed');

      return c.json({ ok: true } as const, 200);
    },
  );
}

export default controller;
