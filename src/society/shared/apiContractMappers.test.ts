import { describe, expect, it } from "vitest";
import {
	toArticleDetailSnapshotViewModel,
	toArticleViewModel,
	toNotificationListSnapshotViewModel,
} from "./apiContractMappers";

describe("apiContractMappers", () => {
	it("normalizes optional nullable fields into core-shaped article snapshots", () => {
		const snapshot = toArticleDetailSnapshotViewModel({
			article: {
				authorName: "회원",
				body: "정상에서 찍은 사진",
				createdAt: "2026-07-10T10:00:00.000Z",
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
					body: "좋아요",
					createdAt: "2026-07-10T11:00:00.000Z",
					id: "11",
					likeCount: 0,
					likedByCurrentUser: false,
					updatedAt: "2026-07-10T11:00:00.000Z",
				},
			],
		});

		expect(snapshot.article.authorProfileImageUrl).toBeNull();
		expect(snapshot.article.deletedAt).toBeNull();
		expect(snapshot.article.media).toHaveLength(1);
		expect(snapshot.comments[0]?.authorProfileImageUrl).toBeNull();
		expect(snapshot.comments[0]?.deletedAt).toBeNull();
		expect(snapshot.comments[0]?.parentCommentId).toBeNull();
	});

	it("rejects article contracts that violate the non-empty media invariant", () => {
		expect(() =>
			toArticleViewModel({
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
		).toThrow("Article contract must contain at least one media item.");
	});

	it("normalizes optional nullable fields into core-shaped notifications", () => {
		const snapshot = toNotificationListSnapshotViewModel({
			hasMoreNotifications: false,
			hasUnreadNotifications: true,
			notifications: [
				{
					actorName: "회원",
					actorUserId: 1,
					articleId: "7",
					contentExcerpt: "새 글",
					createdAt: "2026-07-10T10:00:00.000Z",
					id: "13",
					type: "article_created",
				},
			],
		});

		expect(snapshot.notifications[0]?.actorProfileImageUrl).toBeNull();
		expect(snapshot.notifications[0]?.commentId).toBeNull();
		expect(snapshot.notifications[0]?.readAt).toBeNull();
	});
});
