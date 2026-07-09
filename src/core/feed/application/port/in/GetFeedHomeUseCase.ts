import type { AuthenticatedUser } from "@/core/auth/model/AuthenticatedUser";
import type { FeedHomeResult } from "@/core/feed/model/FeedHome";

export interface GetFeedHomeUseCase {
	get(input: {
		readonly currentUser: AuthenticatedUser;
		readonly includeNotifications?: boolean;
	}): Promise<FeedHomeResult>;
}
