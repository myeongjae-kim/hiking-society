import { z } from "zod";
import { articleSchema } from "@/core/article/domain/ArticleSchema";
import type { Article } from "@/core/article/domain";
import { commentSchema } from "@/core/comment/domain/CommentSchema";
import type { Comment } from "@/core/comment/domain";
import { hikingArticlesSnapshotSchema } from "@/core/feed/model/FeedSnapshotSchema";
import type { HikingArticlesSnapshot } from "@/core/feed/model/FeedSnapshot";
import { notificationListSnapshotSchema } from "@/core/notification/model/NotificationSchema";
import type { NotificationListSnapshot } from "@/core/notification/model/Notification";

export type ArticleDetailResponse = {
	readonly article: Article;
	readonly comments: readonly Comment[];
};

export type CommentsResponse = {
	readonly comments: readonly Comment[];
};

const articleDetailResponseSchema = z.object({
	article: articleSchema,
	comments: z.array(commentSchema),
});

const commentsResponseSchema = z.object({
	comments: z.array(commentSchema),
});

export function parseArticle(input: unknown): Article {
	return articleSchema.parse(input);
}

export function parseArticleDetailResponse(
	input: unknown,
): ArticleDetailResponse {
	return articleDetailResponseSchema.parse(input);
}

export function parseCommentsResponse(input: unknown): CommentsResponse {
	return commentsResponseSchema.parse(input);
}

export function parseHikingArticlesResponse(
	input: unknown,
): HikingArticlesSnapshot {
	return hikingArticlesSnapshotSchema.parse(input);
}

export function parseNotificationListResponse(
	input: unknown,
): NotificationListSnapshot {
	return notificationListSnapshotSchema.parse(input);
}
