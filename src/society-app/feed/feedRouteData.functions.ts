import { getUseCase } from "#/core/config/getUseCase";
import {
	readCurrentTheme,
	readCurrentUser,
} from "#/society-app/auth/session.functions";
import type { GetFeedHomeUseCase } from "@/core/feed/application/port/in/GetFeedHomeUseCase";
import { createServerFn } from "@tanstack/react-start";

type GetFeedRouteDataDeps = {
	readonly getFeedHomeUseCase: GetFeedHomeUseCase;
	readonly readCurrentTheme: typeof readCurrentTheme;
	readonly readCurrentUser: typeof readCurrentUser;
};

async function getFeedRouteDataHandler({
	getFeedHomeUseCase,
	readCurrentTheme,
	readCurrentUser,
}: GetFeedRouteDataDeps) {
	const user = await readCurrentUser();
	const currentTheme = await readCurrentTheme();

	if (!user) {
		return { status: "unauthenticated" as const };
	}

	const data = await getFeedHomeUseCase.get({
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
}

export const getFeedRouteData = createServerFn({ method: "GET" }).handler(
	async () =>
		getFeedRouteDataHandler({
			getFeedHomeUseCase: getUseCase("GetFeedHomeUseCase"),
			readCurrentTheme,
			readCurrentUser,
		}),
);
