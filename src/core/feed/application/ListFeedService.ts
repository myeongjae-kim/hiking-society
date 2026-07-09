import type { TransactionPort } from "@/core/common/application/port/out/TransactionPort";
import { Autowired } from "@/core/config/Autowired";
import type { ListFeedUseCase } from "./port/in/ListFeedUseCase";
import type { FeedQueryPort } from "./port/out/FeedQueryPort";

export class ListFeedService implements ListFeedUseCase {
	constructor(
		@Autowired("FeedQueryPort")
		private feedQueryPort: FeedQueryPort,
		@Autowired("TransactionPort")
		private transactionPort: TransactionPort,
	) {}

	async listHikings(input: Parameters<ListFeedUseCase["listHikings"]>[0]) {
		return this.transactionPort.run(() =>
			this.feedQueryPort.listHikings(input),
		);
	}

	async listHikingArticles(
		input: Parameters<ListFeedUseCase["listHikingArticles"]>[0],
	) {
		return this.transactionPort.run(() =>
			this.feedQueryPort.listHikingArticles(input),
		);
	}
}
