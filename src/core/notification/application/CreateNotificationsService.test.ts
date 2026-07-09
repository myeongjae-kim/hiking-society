import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleId } from "@/core/article/domain";
import type { CommentId } from "@/core/comment/domain";
import { CreateNotificationsService } from "./CreateNotificationsService";
import type { NotificationCommandPort } from "./port/out/NotificationCommandPort";

const articleId = "1" as ArticleId;
const commentId = "10" as CommentId;

function createCommandPort(): NotificationCommandPort {
	return {
		createMany: vi.fn().mockResolvedValue(undefined),
		markAllRead: vi.fn().mockResolvedValue(undefined),
		markRead: vi.fn().mockResolvedValue(undefined),
	};
}

describe("CreateNotificationsService", () => {
	let commandPort: NotificationCommandPort;
	let service: CreateNotificationsService;

	beforeEach(() => {
		commandPort = createCommandPort();
		service = new CreateNotificationsService(commandPort);
	});

	it("creates article notifications through the command port", async () => {
		await service.createArticleCreated({
			actorUserId: 1,
			articleBody: "  정상에서   찍은 사진입니다  ",
			articleId,
			recipientUserIds: [2],
		});

		expect(commandPort.createMany).toHaveBeenCalledWith({
			notifications: [
				expect.objectContaining({
					actorUserId: 1,
					articleId,
					contentExcerpt: "정상에서 찍은 사진입니다",
					recipientUserId: 2,
					type: "article_created",
				}),
			],
		});
	});

	it("does not create self-like notifications", async () => {
		await service.createCommentLike({
			actorUserId: 1,
			articleId,
			commentAuthorUserId: 1,
			commentBody: "댓글",
			commentId,
		});

		expect(commandPort.createMany).toHaveBeenCalledWith({
			notifications: [],
		});
	});
});
