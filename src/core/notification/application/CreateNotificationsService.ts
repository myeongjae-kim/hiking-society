import type { TransactionPort } from "@/core/common/application/port/out/TransactionPort";
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
		@Autowired("TransactionPort")
		private transactionPort: TransactionPort,
	) {}

	async createArticleCreated(
		input: Parameters<CreateNotificationsUseCase["createArticleCreated"]>[0],
	) {
		await this.transactionPort.run(
			() =>
				this.notificationCommandPort.createMany({
					notifications: createArticleCreatedNotifications(input),
				}),
			{ readOnly: false },
		);
	}

	async createArticleLike(
		input: Parameters<CreateNotificationsUseCase["createArticleLike"]>[0],
	) {
		const notification = createArticleLikeNotification(input);

		await this.transactionPort.run(
			() =>
				this.notificationCommandPort.createMany({
					notifications: notification ? [notification] : [],
				}),
			{ readOnly: false },
		);
	}

	async createComment(
		input: Parameters<CreateNotificationsUseCase["createComment"]>[0],
	) {
		await this.transactionPort.run(
			() =>
				this.notificationCommandPort.createMany({
					notifications: createCommentNotifications(input),
				}),
			{ readOnly: false },
		);
	}

	async createCommentLike(
		input: Parameters<CreateNotificationsUseCase["createCommentLike"]>[0],
	) {
		const notification = createCommentLikeNotification(input);

		await this.transactionPort.run(
			() =>
				this.notificationCommandPort.createMany({
					notifications: notification ? [notification] : [],
				}),
			{ readOnly: false },
		);
	}
}
