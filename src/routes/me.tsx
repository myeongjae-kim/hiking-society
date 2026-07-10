import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	getCurrentTheme,
	getCurrentUser,
} from "#/society-app/auth/session.functions";
import { getLoginRedirectHref } from "#/society/auth/session.shared";
import MyPageView from "#/society/profile/ProfilePageView";

export const Route = createFileRoute("/me")({
	component: MyRoute,
	loader: async ({ location }) => {
		const user = await getCurrentUser();

		if (!user) {
			throw redirect({ href: getLoginRedirectHref(location.href) });
		}

		return {
			theme: await getCurrentTheme(),
			user,
		};
	},
});

function MyRoute() {
	return <MyPageView {...Route.useLoaderData()} />;
}
