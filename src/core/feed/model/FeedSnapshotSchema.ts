import { z } from "zod";
import { articleSchema } from "@/core/article/domain/ArticleSchema";
import { commentSchema } from "@/core/comment/domain/CommentSchema";
import { hikingSchema, hikingIdSchema } from "@/core/hiking/domain/HikingSchema";
import type {
	FeedSnapshot,
	FeedSummarySnapshot,
	HikingArticleCount,
	HikingArticlesSnapshot,
} from "./FeedSnapshot";

export const feedSnapshotSchema = z.object({
	articles: z.array(articleSchema),
	comments: z.array(commentSchema),
	hikings: z.array(hikingSchema),
}) satisfies z.ZodType<FeedSnapshot>;

export const hikingArticleCountSchema = z.object({
	articleCount: z.number().int(),
	hikingId: hikingIdSchema,
}) satisfies z.ZodType<HikingArticleCount>;

export const feedSummarySnapshotSchema = z.object({
	articleCount: z.number().int(),
	commentCount: z.number().int(),
	hikingArticleCounts: z.array(hikingArticleCountSchema),
	hikings: z.array(hikingSchema),
}) satisfies z.ZodType<FeedSummarySnapshot>;

export const hikingArticlesSnapshotSchema = z.object({
	articles: z.array(articleSchema),
	comments: z.array(commentSchema),
}) satisfies z.ZodType<HikingArticlesSnapshot>;
