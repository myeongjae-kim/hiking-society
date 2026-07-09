import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentUser } from "#/society-app/auth/session.functions";
import Home from "#/society/auth/LoginPageView";
import { getSafeRedirectTarget } from "#/society/auth/redirectTarget";
import { getAuthenticatedHomeRedirectHref } from "#/society/auth/session.shared";

function getSingleSearchParam(value: unknown) {
	return Array.isArray(value) ? value[0] : value;
}

function validateHomeSearch(search: Record<string, unknown>): {
	next?: string;
} {
	const next = getSingleSearchParam(search.next);

	return {
		next: typeof next === "string" ? next : undefined,
	};
}

export const Route = createFileRoute("/")({
	beforeLoad: async ({ search }) => {
		const user = await getCurrentUser();
		const { next } = validateHomeSearch(search);

		if (user) {
			throw redirect({
				href: getAuthenticatedHomeRedirectHref(next),
			});
		}
	},
	component: HomeRoute,
	validateSearch: validateHomeSearch,
});

function HomeRoute() {
	const { next } = Route.useSearch();

	return <Home redirectTo={getSafeRedirectTarget(next)} />;
}
