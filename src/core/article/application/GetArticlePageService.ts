import { UserRolePolicy } from "@/core/auth/model/roles";
import type { TransactionPort } from "@/core/common/application/port/out/TransactionPort";
import { Autowired } from "@/core/config/Autowired";
import type { ListNotificationsUseCase } from "@/core/notification/application/port/in/ListNotificationsUseCase";
import type { GetArticleDetailUseCase } from "./port/in/GetArticleDetailUseCase";
import type { GetArticlePageUseCase } from "./port/in/GetArticlePageUseCase";

export class GetArticlePageService implements GetArticlePageUseCase {
	constructor(
		@Autowired("GetArticleDetailUseCase")
		private getArticleDetailUseCase: GetArticleDetailUseCase,
		@Autowired("ListNotificationsUseCase")
		private listNotificationsUseCase: ListNotificationsUseCase,
		@Autowired("TransactionPort")
		private transactionPort: TransactionPort,
	) {}

	async get(input: Parameters<GetArticlePageUseCase["get"]>[0]) {
		if (!UserRolePolicy.of(input.currentUser.role).canAccessMemberContent()) {
			return { status: "associate" as const };
		}

		return this.transactionPort.run(async () => {
			const snapshot = await this.getArticleDetailUseCase.get({
				articleId: input.articleId,
				currentUserId: input.currentUser.id,
			});

			if (!snapshot) {
				return { status: "notFound" as const };
			}

			const notificationSnapshot = input.includeNotifications
				? await this.listNotificationsUseCase.list({
						currentUserId: input.currentUser.id,
					})
				: null;

			return {
				notificationSnapshot,
				snapshot,
				status: "ok" as const,
			};
		});
	}
}
