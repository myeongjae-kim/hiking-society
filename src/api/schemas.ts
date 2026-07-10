import { z } from "@hono/zod-openapi";
import {
	articleMediaMetadataSummarySchema,
	articleMediaSchema as coreArticleMediaSchema,
	articleMediaTypeSchema,
	articleSchema as coreArticleSchema,
} from "@/core/article/domain/ArticleSchema";
import { authenticatedUserSchema } from "@/core/auth/model/AuthenticatedUserSchema";
import { userRoleSchema as coreUserRoleSchema } from "@/core/auth/model/UserRoleSchema";
import { commentSchema as coreCommentSchema } from "@/core/comment/domain/CommentSchema";
import { feedSummarySnapshotSchema } from "@/core/feed/model/FeedSnapshotSchema";
import { hikingSchema as coreHikingSchema } from "@/core/hiking/domain/HikingSchema";
import { memberListItemSchema } from "@/core/member/model/MemberListItemSchema";
import { notificationListSnapshotSchema } from "@/core/notification/model/NotificationSchema";
import { notificationSummarySchema } from "@/core/notification/model/NotificationSchema";

export const idParamSchema = z.object({
	articleId: z.string().regex(/^\d+$/).optional(),
	commentId: z.string().regex(/^\d+$/).optional(),
	hikingId: z.string().regex(/^\d+$/).optional(),
	notificationId: z.string().regex(/^\d+$/).optional(),
	userId: z.string().regex(/^\d+$/).optional(),
});

export const okSchema = z.object({ ok: z.literal(true) }).openapi("OkResponse");

export const userRoleSchema = coreUserRoleSchema.openapi("UserRole");

export const currentUserSchema = authenticatedUserSchema
	.omit({ lastLoginAt: true })
	.extend({ role: userRoleSchema })
	.openapi("CurrentUser");

export const articleMediaMetadataSchema =
	articleMediaMetadataSummarySchema.nullish();

export const articleMediaSchema =
	coreArticleMediaSchema.openapi("ArticleMedia");

export const articleSchema = coreArticleSchema
	.extend({ media: z.array(articleMediaSchema).min(1) })
	.openapi("Article");
export const commentSchema = coreCommentSchema.openapi("Comment");
export const hikingSchema = coreHikingSchema.openapi("Hiking");
export const notificationSchema =
	notificationSummarySchema.openapi("Notification");

export const feedResponseSchema = feedSummarySnapshotSchema
	.extend({ hikings: z.array(hikingSchema) })
	.openapi("FeedResponse");

export const hikingArticlesResponseSchema = z
	.object({
		articles: z.array(articleSchema),
		comments: z.array(commentSchema),
	})
	.openapi("HikingArticlesResponse");

export const articleDetailResponseSchema = z
	.object({
		article: articleSchema,
		comments: z.array(commentSchema),
	})
	.openapi("ArticleDetailResponse");

export const commentsResponseSchema = z
	.object({ comments: z.array(commentSchema) })
	.openapi("CommentsResponse");

export const notificationListResponseSchema = notificationListSnapshotSchema
	.extend({ notifications: z.array(notificationSchema) })
	.openapi("NotificationListResponse");

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
	.openapi("GeocodingSearchResponse");

export const memberSchema = memberListItemSchema
	.extend({ role: userRoleSchema })
	.openapi("Member");

export const membersResponseSchema = z
	.object({ members: z.array(memberSchema) })
	.openapi("MembersResponse");

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
			contentType: z.literal("image/webp"),
			objectKey: z.string().min(1),
			url: z.string().url(),
		})
		.optional(),
	removeProfileImage: z.boolean(),
});
export const profileImageUploadTargetBodySchema = z.object({
	byteSize: z.number().int().positive(),
	contentType: z.literal("image/webp"),
	fileName: z.string().trim().min(1).max(255),
});
export const profileImageUploadTargetResponseSchema = z
	.object({
		objectKey: z.string(),
		uploadUrl: z.string(),
		url: z.string(),
	})
	.openapi("ProfileImageUploadTargetResponse");
export const cleanupUploadsBodySchema = z.object({
	objectKeys: z.array(z.string().min(1)),
});

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
	mediaType: articleMediaTypeSchema,
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
		mediaType: articleMediaTypeSchema,
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
	role: userRoleSchema,
});

export type ArticleMediaUploadTargetsResponse = z.infer<
	typeof articleMediaUploadTargetsResponseSchema
>;

export type ProfileImageUploadTargetResponse = z.infer<
	typeof profileImageUploadTargetResponseSchema
>;
