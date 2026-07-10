import { z } from "zod";
import {
	authorNameSchema,
	isoDateTimeStringSchema,
	numericIdStringSchema,
	typedSchema,
} from "@/core/common/domain/CommonSchema";
import { hikingIdSchema } from "@/core/hiking/domain/HikingSchema";
import type {
	Article,
	ArticleId,
	ArticleMedia,
	ArticleMediaItems,
	ArticleMediaMetadataSummary,
	ArticleMediaType,
} from "./Article";

export const articleIdSchema = typedSchema<ArticleId>(numericIdStringSchema);

export const articleMediaTypeSchema = z.enum([
	"image",
	"video",
]) satisfies z.ZodType<ArticleMediaType>;

export const articleMediaMetadataSummarySchema = z.object({
	dateTime: z.string().nullish(),
	exposureTime: z.string().nullish(),
	fNumber: z.string().nullish(),
	focalLengthIn35mmFilm: z.string().nullish(),
	isoSpeedRatings: z.string().nullish(),
	make: z.string().nullish(),
	model: z.string().nullish(),
	shutterSpeedValue: z.string().nullish(),
}) satisfies z.ZodType<ArticleMediaMetadataSummary>;

export const articleMediaSchema = z.object({
	byteSize: z.number().optional(),
	contentType: z.string().optional(),
	durationMs: z.number().nullish(),
	height: z.number().nullish(),
	mediaType: articleMediaTypeSchema,
	metadata: articleMediaMetadataSummarySchema.nullish(),
	objectKey: z.string().optional(),
	order: z.number().int(),
	thumbnailUrl: z.string().nullish(),
	url: z.string(),
	width: z.number().nullish(),
}) satisfies z.ZodType<ArticleMedia>;

export const articleMediaItemsSchema = typedSchema<ArticleMediaItems>(
	z.array(articleMediaSchema).min(1),
);

export const articleSchema = z.object({
	authorName: authorNameSchema,
	authorProfileImageUrl: z.string().nullable(),
	authorUserId: z.number().int().optional(),
	body: z.string(),
	createdAt: isoDateTimeStringSchema,
	deletedAt: isoDateTimeStringSchema.nullable(),
	edited: z.boolean(),
	hikingId: hikingIdSchema,
	id: articleIdSchema,
	likeCount: z.number().int(),
	likedByCurrentUser: z.boolean(),
	media: articleMediaItemsSchema,
	updatedAt: isoDateTimeStringSchema,
}) satisfies z.ZodType<Article>;
