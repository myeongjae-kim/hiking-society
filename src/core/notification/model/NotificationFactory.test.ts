import { describe, expect, it } from "vitest";
import type { ArticleId } from "@/core/article/domain";
import type { CommentId } from "@/core/comment/domain";
import {
	createArticleCreatedNotifications,
	createArticleLikeNotification,
	createCommentLikeNotification,
	createCommentNotifications,
} from "@/core/notification/model/NotificationFactory";

const articleId = "1" as ArticleId;
const commentId = "10" as CommentId;
const parentCommentId = "9" as CommentId;

describe("NotificationFactory", () => {
	it("creates article-created notifications for every recipient", () => {
		const notifications = createArticleCreatedNotifications({
			actorUserId: 1,
			articleBody: "  정상에서   찍은 사진입니다  ",
			articleId,
			recipientUserIds: [2, 3],
		});

		expect(notifications).toEqual([
			expect.objectContaining({
				actorUserId: 1,
				articleId,
				commentId: null,
				contentExcerpt: "정상에서 찍은 사진입니다",
				recipientUserId: 2,
				type: "article_created",
			}),
			expect.objectContaining({
				recipientUserId: 3,
				type: "article_created",
			}),
		]);
	});

	it("notifies article and parent comment authors for replies without duplicating recipients", () => {
		const notifications = createCommentNotifications({
			actorUserId: 1,
			articleAuthorUserId: 2,
			articleId,
			commentBody: "답글입니다",
			commentId,
			parentCommentAuthorUserId: 2,
			parentCommentId,
		});

		expect(notifications).toEqual([
			expect.objectContaining({
				recipientUserId: 2,
				type: "comment_reply",
			}),
		]);
	});

	it("does not notify users about their own likes", () => {
		expect(
			createArticleLikeNotification({
				actorUserId: 1,
				articleAuthorUserId: 1,
				articleBody: "본문",
				articleId,
			}),
		).toBeNull();

		expect(
			createCommentLikeNotification({
				actorUserId: 1,
				articleId,
				commentAuthorUserId: 1,
				commentBody: "댓글",
				commentId,
			}),
		).toBeNull();
	});
});
