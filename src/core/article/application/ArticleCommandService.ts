import { applicationError } from "@/core/common/application/ApplicationError";
import { Autowired } from "@/core/config/Autowired";
import type { NotificationCommandPort } from "@/core/notification/application/port/out/NotificationCommandPort";
import { createArticleCreatedNotifications } from "@/core/notification/model/NotificationFactory";
import type { ArticleCommandUseCase } from "./port/in/ArticleCommandUseCase";
import type { ArticleCommandPort } from "./port/out/ArticleCommandPort";

export class ArticleCommandService implements ArticleCommandUseCase {
	constructor(
		@Autowired("ArticleCommandPort")
		private articleCommandPort: ArticleCommandPort,
		@Autowired("NotificationCommandPort")
		private notificationCommandPort: NotificationCommandPort,
	) {}

	async create(input: Parameters<ArticleCommandUseCase["create"]>[0]) {
		if (input.media.length === 0) {
			throw applicationError.badRequest(
				"글은 사진이나 동영상 없이 저장할 수 없습니다.",
			);
		}

		const hasActiveHiking = await this.articleCommandPort.hasActiveHiking(
			input.hikingId,
		);

		if (!hasActiveHiking) {
			throw applicationError.notFound("산행을 찾을 수 없습니다.");
		}

		const articleId = await this.articleCommandPort.create({
			authorUserId: input.authorUserId,
			body: input.body,
			hikingId: input.hikingId,
			storedMedia: input.media,
		});
		const recipientUserIds =
			await this.articleCommandPort.listActiveNotificationRecipientIds({
				excludeUserId: input.authorUserId,
			});

		await this.notificationCommandPort.createMany({
			notifications: createArticleCreatedNotifications({
				actorUserId: input.authorUserId,
				articleBody: input.body,
				articleId,
				recipientUserIds,
			}),
		});
	}

	async update(input: Parameters<ArticleCommandUseCase["update"]>[0]) {
		if (input.media.length === 0) {
			throw applicationError.badRequest(
				"글은 사진이나 동영상 없이 저장할 수 없습니다.",
			);
		}

		const article = await this.articleCommandPort.findActiveArticleById(
			input.articleId,
		);

		if (!article || article.authorUserId !== input.userId) {
			throw applicationError.notFound(
				"글을 수정할 권한이 없거나 글을 찾을 수 없습니다.",
			);
		}

		const updated = await this.articleCommandPort.update({
			articleId: input.articleId,
			now: new Date(),
			storedMedia: input.media,
			values: {
				body: input.body,
			},
		});

		if (!updated) {
			throw applicationError.notFound(
				"글을 수정할 권한이 없거나 글을 찾을 수 없습니다.",
			);
		}
	}

	async delete(input: Parameters<ArticleCommandUseCase["delete"]>[0]) {
		const article = await this.articleCommandPort.findActiveArticleById(
			input.articleId,
		);

		if (!article || article.authorUserId !== input.userId) {
			throw applicationError.notFound(
				"글을 삭제할 권한이 없거나 글을 찾을 수 없습니다.",
			);
		}

		const deleted = await this.articleCommandPort.delete({
			articleId: input.articleId,
			now: new Date(),
		});

		if (!deleted) {
			throw applicationError.notFound(
				"글을 삭제할 권한이 없거나 글을 찾을 수 없습니다.",
			);
		}
	}
}
