import { createFileRoute, redirect } from "@tanstack/react-router";
import { getFeedRouteData } from "#/society-app/feed/feedRouteData.functions";
import { getLoginRedirectHref } from "#/society/auth/session.shared";
import FeedPageView from "#/society/feed/FeedPageView";
import { toNumericSearchId } from "#/routing/searchParams";
import type { HikingViewId as HikingId } from "#/society/shared/viewModels";

export const Route = createFileRoute("/feed")({
	component: FeedRoute,
	loader: async ({ location }) => {
		const data = await getFeedRouteData();

		if (data.status === "unauthenticated") {
			throw redirect({ href: getLoginRedirectHref(location.href) });
		}

		if (data.status === "associate") {
			return {
				currentTheme: data.currentTheme,
				feedSummary: null,
				notificationSnapshot: null,
				selectedHikingId: null,
				user: data.user,
			};
		}

		return {
			currentTheme: data.currentTheme,
			feedSummary: data.feedSummary,
			notificationSnapshot: data.notificationSnapshot,
			selectedHikingId: null,
			user: data.user,
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
