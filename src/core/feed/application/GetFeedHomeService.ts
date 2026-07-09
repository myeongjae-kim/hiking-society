import { UserRolePolicy } from "@/core/auth/model/roles";
import { Autowired } from "@/core/config/Autowired";
import type { ListNotificationsUseCase } from "@/core/notification/application/port/in/ListNotificationsUseCase";
import type { GetFeedHomeUseCase } from "./port/in/GetFeedHomeUseCase";
import type { ListFeedUseCase } from "./port/in/ListFeedUseCase";

export class GetFeedHomeService implements GetFeedHomeUseCase {
	constructor(
		@Autowired("ListFeedUseCase")
		private listFeedUseCase: ListFeedUseCase,
		@Autowired("ListNotificationsUseCase")
		private listNotificationsUseCase: ListNotificationsUseCase,
	) {}

	async get(input: Parameters<GetFeedHomeUseCase["get"]>[0]) {
		if (!UserRolePolicy.of(input.currentUser.role).canAccessMemberContent()) {
			return {
				status: "associate" as const,
				user: input.currentUser,
			};
		}

		const [feedSummary, notificationSnapshot] = await Promise.all([
			this.listFeedUseCase.listHikings({
				currentUserId: input.currentUser.id,
			}),
			input.includeNotifications
				? this.listNotificationsUseCase.list({
						currentUserId: input.currentUser.id,
					})
				: Promise.resolve(null),
		]);

		return {
			feedSummary,
			notificationSnapshot,
			status: "ok" as const,
			user: input.currentUser,
		};
	}
}
