import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getUseCase } from "#/infrastructure/config/getUseCase";
import { getLoginRedirectHref } from "#/society/auth/session.shared";
import FeedPageView from "#/society/feed/FeedPageView";
import { toNumericSearchId } from "#/routing/searchParams";
import {
	readCurrentTheme,
	readCurrentUser,
} from "#/society-app/auth/session.functions";
import type { HikingViewId as HikingId } from "#/society/shared/viewModels";

const getFeedRouteData = createServerFn({ method: "GET" }).handler(
	async () => {
		const user = await readCurrentUser();
		const currentTheme = await readCurrentTheme();

		if (!user) {
			return { status: "unauthenticated" as const };
		}

		const data = await getUseCase("GetFeedHomeUseCase").get({
			currentUser: user,
			includeNotifications: true,
		});

		if (data.status === "associate") {
			return {
				currentTheme,
				feedSummary: null,
				notificationSnapshot: null,
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

export const Route = createFileRoute("/feed")({
	component: FeedRoute,
	loader: async ({ location }) => {
		const data = await getFeedRouteData();

		if (data.status === "unauthenticated") {
			throw redirect({ href: getLoginRedirectHref(location.href) });
		}

		const { status: _status, ...routeData } = data;

		return {
			...routeData,
			selectedHikingId: null,
		};
	},
	validateSearch: (search) => ({
		hikingId: toNumericSearchId<HikingId>(search.hikingId),
	}),
});

function FeedRoute() {
	const data = Route.useLoaderData();
	const { hikingId } = Route.useSearch();

	return <FeedPageView {...data} selectedHikingId={hikingId} />;
}
