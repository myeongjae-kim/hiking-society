import { mutableRoles } from '@/core/auth/model/roles';
import { z } from '@hono/zod-openapi';

export const idParamSchema = z.object({
  articleId: z.string().regex(/^\d+$/).optional(),
  commentId: z.string().regex(/^\d+$/).optional(),
  hikingId: z.string().regex(/^\d+$/).optional(),
  notificationId: z.string().regex(/^\d+$/).optional(),
  userId: z.string().regex(/^\d+$/).optional(),
});

export const okSchema = z.object({ ok: z.literal(true) }).openapi('OkResponse');

export const userRoleSchema = z.enum(['associate', 'member', 'admin']).openapi('UserRole');

export const currentUserSchema = z
  .object({
    displayName: z.string().nullish(),
    email: z.string(),
    id: z.number().int(),
    name: z.string().nullish(),
    profileImageUrl: z.string().nullish(),
    provider: z.string().nullish(),
    role: userRoleSchema,
  })
  .openapi('CurrentUser');

export const articleMediaMetadataSchema = z
  .object({
    dateTime: z.string().nullish(),
    exposureTime: z.string().nullish(),
    fNumber: z.string().nullish(),
    focalLengthIn35mmFilm: z.string().nullish(),
    isoSpeedRatings: z.string().nullish(),
    make: z.string().nullish(),
    model: z.string().nullish(),
    shutterSpeedValue: z.string().nullish(),
  })
  .nullish();

export const articleMediaSchema = z.object({
  byteSize: z.number().optional(),
  contentType: z.string().optional(),
  durationMs: z.number().nullish(),
  height: z.number().nullish(),
  mediaType: z.enum(['image', 'video']),
  metadata: articleMediaMetadataSchema.optional(),
  objectKey: z.string().optional(),
  order: z.number().int(),
  thumbnailUrl: z.string().nullish(),
  url: z.string(),
  width: z.number().nullish(),
});

export const articleSchema = z
  .object({
    authorName: z.string(),
    authorProfileImageUrl: z.string().nullish(),
    authorUserId: z.number().int().optional(),
    body: z.string(),
    createdAt: z.string(),
    deletedAt: z.string().nullish(),
    edited: z.boolean(),
    hikingId: z.string(),
    id: z.string(),
    likeCount: z.number().int(),
    likedByCurrentUser: z.boolean(),
    media: z.array(articleMediaSchema).min(1),
    updatedAt: z.string(),
  })
  .openapi('Article');

export const commentSchema = z
  .object({
    articleId: z.string(),
    authorName: z.string(),
    authorProfileImageUrl: z.string().nullish(),
    authorUserId: z.number().int().optional(),
    body: z.string(),
    createdAt: z.string(),
    deletedAt: z.string().nullish(),
    id: z.string(),
    likeCount: z.number().int(),
    likedByCurrentUser: z.boolean(),
    parentCommentId: z.string().nullish(),
    updatedAt: z.string(),
  })
  .openapi('Comment');

export const hikingSchema = z
  .object({
    altitude: z.number().nullish(),
    authorName: z.string(),
    authorUserId: z.number().int().optional(),
    completedAt: z.string(),
    createdAt: z.string(),
    hikingDate: z.string(),
    id: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    mountainName: z.string(),
    order: z.number().int(),
    participantsCsv: z.string(),
    restaurantAddress: z.string().nullish(),
    startedAt: z.string(),
    timezone: z.string(),
    updatedAt: z.string(),
  })
  .openapi('Hiking');

export const notificationSchema = z
  .object({
    actorName: z.string(),
    actorProfileImageUrl: z.string().nullish(),
    actorUserId: z.number().int(),
    articleId: z.string(),
    commentId: z.string().nullish(),
    contentExcerpt: z.string(),
    createdAt: z.string(),
    id: z.string(),
    readAt: z.string().nullish(),
    type: z.enum([
      'article_created',
      'article_comment',
      'article_reply',
      'comment_reply',
      'article_like',
      'comment_like',
    ]),
  })
  .openapi('Notification');

export const feedResponseSchema = z
  .object({
    articleCount: z.number().int(),
    commentCount: z.number().int(),
    hikingArticleCounts: z.array(
      z.object({
        articleCount: z.number().int(),
        hikingId: z.string(),
      }),
    ),
    hikings: z.array(hikingSchema),
  })
  .openapi('FeedResponse');

export const hikingArticlesResponseSchema = z
  .object({
    articles: z.array(articleSchema),
    comments: z.array(commentSchema),
  })
  .openapi('HikingArticlesResponse');

export const articleDetailResponseSchema = z
  .object({
    article: articleSchema,
    comments: z.array(commentSchema),
  })
  .openapi('ArticleDetailResponse');

export const commentsResponseSchema = z
  .object({ comments: z.array(commentSchema) })
  .openapi('CommentsResponse');

export const notificationListResponseSchema = z
  .object({
    hasMoreNotifications: z.boolean(),
    hasUnreadNotifications: z.boolean(),
    notifications: z.array(notificationSchema),
  })
  .openapi('NotificationListResponse');

export const geocodingSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(160),
});

export const geocodingSearchResponseSchema = z
  .object({
    results: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        latitude: z.number(),
        longitude: z.number(),
      }),
    ),
  })
  .openapi('GeocodingSearchResponse');

export const memberSchema = z
  .object({
    createdAt: z.string(),
    displayName: z.string().nullish(),
    email: z.string().nullish(),
    id: z.number().int(),
    lastLoginAt: z.string().nullish(),
    name: z.string().nullish(),
    provider: z.string().nullish(),
    role: userRoleSchema,
  })
  .openapi('Member');

export const membersResponseSchema = z
  .object({ members: z.array(memberSchema) })
  .openapi('MembersResponse');

export const loginWithGoogleBodySchema = z.object({ code: z.string().min(1) });
export const updateDisplayNameBodySchema = z.object({
  displayName: z.string().trim().min(1).max(100),
});
export const updateEmailBodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
});
export const profileImageBodySchema = z.object({
  profileImage: z
    .object({
      byteSize: z.number().int().positive(),
      contentType: z.literal('image/webp'),
      objectKey: z.string().min(1),
      url: z.string().url(),
    })
    .optional(),
  removeProfileImage: z.boolean(),
});
export const profileImageUploadTargetBodySchema = z.object({
  byteSize: z.number().int().positive(),
  contentType: z.literal('image/webp'),
  fileName: z.string().trim().min(1).max(255),
});
export const profileImageUploadTargetResponseSchema = z
  .object({
    objectKey: z.string(),
    uploadUrl: z.string(),
    url: z.string(),
  })
  .openapi('ProfileImageUploadTargetResponse');
export const cleanupUploadsBodySchema = z.object({ objectKeys: z.array(z.string().min(1)) });

export const hikingBodySchema = z.object({
  altitude: z.number().finite().nullish(),
  completedTime: z.string().regex(/^\d{2}:\d{2}$/),
  hikingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  mountainName: z.string().trim().min(1).max(120),
  participantsCsv: z.string().trim().min(1),
  restaurantAddress: z.string().trim(),
  startedTime: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().trim().min(1).max(80),
});

const uploadedArticleMediaSchema = z.object({
  byteSize: z.number().int().positive(),
  contentType: z.string().trim().min(1).max(120),
  durationMs: z.number().nullish(),
  height: z.number().nullish(),
  mediaType: z.enum(['image', 'video']),
  objectKey: z.string().trim().min(1).max(1024),
  order: z.number().int().positive(),
  originalMetadata: z.record(z.string(), z.unknown()).nullish(),
  thumbnailUrl: z.string().url().nullish(),
  url: z.string().url(),
  width: z.number().nullish(),
});

export const articleBodySchema = z.object({
  body: z.string().trim().min(1),
  existingMedia: z.array(articleMediaSchema).default([]),
  uploadedMedia: z.array(uploadedArticleMediaSchema).default([]),
});

export const articleMediaUploadTargetsBodySchema = z.array(
  z.object({
    byteSize: z
      .number()
      .int()
      .positive()
      .max(200 * 1024 * 1024),
    contentType: z.string().trim().min(1).max(120),
    fileName: z.string().trim().min(1).max(255),
    mediaType: z.enum(['image', 'video']),
    thumbnail: z
      .object({
        byteSize: z
          .number()
          .int()
          .positive()
          .max(25 * 1024 * 1024),
        contentType: z.string().trim().min(1).max(120),
        fileName: z.string().trim().min(1).max(255),
      })
      .optional(),
  }),
);

export const articleMediaUploadTargetsResponseSchema = z.object({
  targets: z.array(
    z.object({
      objectKey: z.string(),
      thumbnail: z
        .object({
          objectKey: z.string(),
          uploadUrl: z.string(),
          url: z.string(),
        })
        .optional(),
      uploadUrl: z.string(),
      url: z.string(),
    }),
  ),
});

export const commentBodySchema = z.object({
  body: z.string().trim().min(1),
  parentCommentId: z.string().regex(/^\d+$/).nullish(),
});

export const notificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const updateMemberRoleBodySchema = z.object({
  role: z.enum(mutableRoles),
});
