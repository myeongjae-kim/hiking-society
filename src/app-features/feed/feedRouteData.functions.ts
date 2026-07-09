import { createServerFn } from "@tanstack/react-start";
import {
	readCurrentTheme,
	readCurrentUser,
} from "#/app-features/auth/session.functions";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

export const getFeedRouteData = createServerFn({ method: "GET" }).handler(
	async () => {
		const [user, currentTheme] = await Promise.all([
			readCurrentUser(),
			readCurrentTheme(),
		]);

		if (!user) {
			return { status: "unauthenticated" as const };
		}

		const data = await applicationUseCaseContext()
			.get("GetFeedHomeUseCase")
			.get({
				currentUser: user,
				includeNotifications: true,
			});

		if (data.status === "associate") {
			return {
				currentTheme,
				status: "associate" as const,
				user,
			};
		}

		return {
			currentTheme,
			feedSummary: data.feedSummary,
			notificationSnapshot: data.notificationSnapshot,
			status: "ok" as const,
			user: data.user,
		};
	},
);
