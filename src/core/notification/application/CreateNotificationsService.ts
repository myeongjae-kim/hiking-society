import { Autowired } from "@/core/config/Autowired";
import {
	createArticleCreatedNotifications,
	createArticleLikeNotification,
	createCommentLikeNotification,
	createCommentNotifications,
} from "@/core/notification/model/NotificationFactory";
import type { CreateNotificationsUseCase } from "./port/in/CreateNotificationsUseCase";
import type { NotificationCommandPort } from "./port/out/NotificationCommandPort";

export class CreateNotificationsService implements CreateNotificationsUseCase {
	constructor(
		@Autowired("NotificationCommandPort")
		private notificationCommandPort: NotificationCommandPort,
	) {}

	async createArticleCreated(
		input: Parameters<CreateNotificationsUseCase["createArticleCreated"]>[0],
	) {
		await this.notificationCommandPort.createMany({
			notifications: createArticleCreatedNotifications(input),
		});
	}

	async createArticleLike(
		input: Parameters<CreateNotificationsUseCase["createArticleLike"]>[0],
	) {
		const notification = createArticleLikeNotification(input);

		await this.notificationCommandPort.createMany({
			notifications: notification ? [notification] : [],
		});
	}

	async createComment(
		input: Parameters<CreateNotificationsUseCase["createComment"]>[0],
	) {
		await this.notificationCommandPort.createMany({
			notifications: createCommentNotifications(input),
		});
	}

	async createCommentLike(
		input: Parameters<CreateNotificationsUseCase["createCommentLike"]>[0],
	) {
		const notification = createCommentLikeNotification(input);

		await this.notificationCommandPort.createMany({
			notifications: notification ? [notification] : [],
		});
	}
}
