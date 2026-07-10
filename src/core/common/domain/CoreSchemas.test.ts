import { describe, expect, it } from "vitest";
import { articleSchema } from "@/core/article/domain/ArticleSchema";
import { userRoleSchema } from "@/core/auth/model/UserRoleSchema";
import { commentSchema } from "@/core/comment/domain/CommentSchema";
import { notificationSummarySchema } from "@/core/notification/model/NotificationSchema";

describe("core canonical schemas", () => {
	it("accepts the application role enum and rejects unknown roles", () => {
		expect(userRoleSchema.parse("admin")).toBe("admin");
		expect(userRoleSchema.parse("member")).toBe("member");
		expect(userRoleSchema.parse("associate")).toBe("associate");
		expect(() => userRoleSchema.parse("owner")).toThrow();
	});

	it("validates article ISO string fields and non-empty media", () => {
		const baseArticle = {
			authorName: "회원",
			authorProfileImageUrl: null,
			body: "정상에서 찍은 사진",
			createdAt: "2026-07-10T10:00:00.000Z",
			deletedAt: null,
			edited: false,
			hikingId: "3",
			id: "7",
			likeCount: 0,
			likedByCurrentUser: false,
			media: [
				{
					mediaType: "image",
					order: 1,
					url: "https://example.com/article.webp",
				},
			],
			updatedAt: "2026-07-10T10:00:00.000Z",
		};

		expect(articleSchema.parse(baseArticle).createdAt).toBe(
			"2026-07-10T10:00:00.000Z",
		);
		expect(() => articleSchema.parse({ ...baseArticle, media: [] })).toThrow();
	});

	it("accepts nullable comment and notification relationship fields", () => {
		expect(
			commentSchema.parse({
				articleId: "7",
				authorName: "회원",
				authorProfileImageUrl: null,
				body: "좋아요",
				createdAt: "2026-07-10T11:00:00.000Z",
				deletedAt: null,
				id: "11",
				likeCount: 0,
				likedByCurrentUser: false,
				parentCommentId: null,
				updatedAt: "2026-07-10T11:00:00.000Z",
			}).parentCommentId,
		).toBeNull();

		expect(
			notificationSummarySchema.parse({
				actorName: "회원",
				actorProfileImageUrl: null,
				actorUserId: 1,
				articleId: "7",
				commentId: null,
				contentExcerpt: "새 글",
				createdAt: "2026-07-10T10:00:00.000Z",
				id: "13",
				readAt: null,
				type: "article_created",
			}).readAt,
		).toBeNull();
	});
});
