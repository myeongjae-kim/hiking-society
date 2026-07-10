import { z } from "zod";
import { articleIdSchema } from "@/core/article/domain/ArticleSchema";
import {
	authorNameSchema,
	isoDateTimeStringSchema,
	numericIdStringSchema,
	typedSchema,
} from "@/core/common/domain/CommonSchema";
import type { Comment, CommentId } from "./Comment";

export const commentIdSchema = typedSchema<CommentId>(numericIdStringSchema);

export const commentSchema = z.object({
	articleId: articleIdSchema,
	authorName: authorNameSchema,
	authorProfileImageUrl: z.string().nullable(),
	authorUserId: z.number().int().optional(),
	body: z.string(),
	createdAt: isoDateTimeStringSchema,
	deletedAt: isoDateTimeStringSchema.nullable(),
	id: commentIdSchema,
	likeCount: z.number().int(),
	likedByCurrentUser: z.boolean(),
	parentCommentId: commentIdSchema.nullable(),
	updatedAt: isoDateTimeStringSchema,
}) as z.ZodType<Comment>;
