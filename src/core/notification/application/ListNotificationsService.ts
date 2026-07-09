import type { TransactionPort } from "@/core/common/application/port/out/TransactionPort";
import { Autowired } from "@/core/config/Autowired";
import type { ListNotificationsUseCase } from "./port/in/ListNotificationsUseCase";
import type { NotificationQueryPort } from "./port/out/NotificationQueryPort";

export class ListNotificationsService implements ListNotificationsUseCase {
	constructor(
		@Autowired("NotificationQueryPort")
		private notificationQueryPort: NotificationQueryPort,
		@Autowired("TransactionPort")
		private transactionPort: TransactionPort,
	) {}

	async list(input: Parameters<ListNotificationsUseCase["list"]>[0]) {
		return this.transactionPort.run(() =>
			this.notificationQueryPort.list(input),
		);
	}
}
