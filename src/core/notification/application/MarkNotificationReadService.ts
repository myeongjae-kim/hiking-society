import type { ClockPort } from "@/core/common/application/port/out/ClockPort";
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
		@Autowired("ClockPort")
		private clockPort: ClockPort,
	) {}

	async markAllRead(
		input: Parameters<MarkAllNotificationsReadUseCase["markAllRead"]>[0],
	) {
		await this.transactionPort.run(
			() =>
				this.notificationCommandPort.markAllRead({
					...input,
					now: this.clockPort.now(),
				}),
			{ readOnly: false },
		);
	}

	async markRead(
		input: Parameters<MarkNotificationReadUseCase["markRead"]>[0],
	) {
		await this.transactionPort.run(
			() =>
				this.notificationCommandPort.markRead({
					...input,
					now: this.clockPort.now(),
				}),
			{ readOnly: false },
		);
	}
}
