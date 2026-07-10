import { describe, expect, it } from "vitest";
import {
	parseArticle,
	parseArticleDetailResponse,
	parseNotificationListResponse,
} from "./apiResponseParsers";

describe("apiResponseParsers", () => {
	it("parses valid REST article detail responses into core-shaped data", () => {
		const snapshot = parseArticleDetailResponse({
			article: {
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
			},
			comments: [
				{
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
				},
			],
		});

		expect(snapshot.article.media).toHaveLength(1);
		expect(snapshot.comments[0]?.parentCommentId).toBeNull();
	});

	it("rejects article responses that violate the non-empty media invariant", () => {
		expect(() =>
			parseArticle({
				authorName: "회원",
				authorProfileImageUrl: null,
				body: "사진 없는 글",
				createdAt: "2026-07-10T10:00:00.000Z",
				deletedAt: null,
				edited: false,
				hikingId: "3",
				id: "7",
				likeCount: 0,
				likedByCurrentUser: false,
				media: [],
				updatedAt: "2026-07-10T10:00:00.000Z",
			}),
		).toThrow();
	});

	it("parses notification responses with nullable fields", () => {
		const snapshot = parseNotificationListResponse({
			hasMoreNotifications: false,
			hasUnreadNotifications: true,
			notifications: [
				{
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
				},
			],
		});

		expect(snapshot.notifications[0]?.commentId).toBeNull();
		expect(snapshot.notifications[0]?.readAt).toBeNull();
	});
});
