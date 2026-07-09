import { UserRolePolicy } from "@/core/auth/model/roles";
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
	) {}

	async get(input: Parameters<GetArticlePageUseCase["get"]>[0]) {
		if (!UserRolePolicy.of(input.currentUser.role).canAccessMemberContent()) {
			return { status: "associate" as const };
		}

		const [snapshot, notificationSnapshot] = await Promise.all([
			this.getArticleDetailUseCase.get({
				articleId: input.articleId,
				currentUserId: input.currentUser.id,
			}),
			input.includeNotifications
				? this.listNotificationsUseCase.list({
						currentUserId: input.currentUser.id,
					})
				: Promise.resolve(null),
		]);

		if (!snapshot) {
			return { status: "notFound" as const };
		}

		return {
			notificationSnapshot,
			snapshot,
			status: "ok" as const,
		};
	}
}
