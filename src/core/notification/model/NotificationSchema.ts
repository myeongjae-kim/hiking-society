import { z } from "zod";
import { articleIdSchema } from "@/core/article/domain/ArticleSchema";
import { commentIdSchema } from "@/core/comment/domain/CommentSchema";
import {
	authorNameSchema,
	isoDateTimeStringSchema,
	numericIdStringSchema,
	typedSchema,
} from "@/core/common/domain/CommonSchema";
import type {
	NotificationListSnapshot,
	NotificationSummary,
	NotificationType,
	NotificationId,
} from "./Notification";

export const notificationIdSchema =
	typedSchema<NotificationId>(numericIdStringSchema);

export const notificationTypeSchema = z.enum([
	"article_created",
	"article_comment",
	"article_reply",
	"comment_reply",
	"article_like",
	"comment_like",
]) satisfies z.ZodType<NotificationType>;

export const notificationSummarySchema = z.object({
	actorName: authorNameSchema,
	actorProfileImageUrl: z.string().nullable(),
	actorUserId: z.number().int(),
	articleId: articleIdSchema,
	commentId: commentIdSchema.nullable(),
	contentExcerpt: z.string(),
	createdAt: isoDateTimeStringSchema,
	id: notificationIdSchema,
	readAt: isoDateTimeStringSchema.nullable(),
	type: notificationTypeSchema,
}) satisfies z.ZodType<NotificationSummary>;

export const notificationListSnapshotSchema = z.object({
	hasMoreNotifications: z.boolean(),
	hasUnreadNotifications: z.boolean(),
	notifications: z.array(notificationSummarySchema),
}) satisfies z.ZodType<NotificationListSnapshot>;
