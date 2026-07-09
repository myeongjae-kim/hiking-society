import type { TransactionPort } from "@/core/common/application/port/out/TransactionPort";
import { Autowired } from "@/core/config/Autowired";
import type { MarkAllNotificationsReadUseCase } from "./port/in/MarkAllNotificationsReadUseCase";
import type { MarkNotificationReadUseCase } from "./port/in/MarkNotificationReadUseCase";
import type { NotificationCommandPort } from "./port/out/NotificationCommandPort";

export class MarkNotificationReadService
	implements MarkNotificationReadUseCase, MarkAllNotificationsReadUseCase
{
	constructor(
		@Autowired("NotificationCommandPort")
		private notificationCommandPort: NotificationCommandPort,
		@Autowired("TransactionPort")
		private transactionPort: TransactionPort,
	) {}

	async markAllRead(
		input: Parameters<MarkAllNotificationsReadUseCase["markAllRead"]>[0],
	) {
		await this.transactionPort.run(
			() => this.notificationCommandPort.markAllRead(input),
			{ readOnly: false },
		);
	}

	async markRead(
		input: Parameters<MarkNotificationReadUseCase["markRead"]>[0],
	) {
		await this.transactionPort.run(
			() => this.notificationCommandPort.markRead(input),
			{ readOnly: false },
		);
	}
}
