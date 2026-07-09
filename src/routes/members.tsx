import { createFileRoute, redirect } from "@tanstack/react-router";
import { getMembersRouteData } from "#/society-app/member/memberRouteData.functions";
import { getLoginRedirectHref } from "#/society/auth/session.shared";
import MembersPageView from "#/society/member/MemberManagementPageView";

export const Route = createFileRoute("/members")({
	component: MembersRoute,
	loader: async ({ location }) => {
		const data = await getMembersRouteData();

		if (data.status === "unauthenticated") {
			throw redirect({ href: getLoginRedirectHref(location.href) });
		}

		if (data.status === "forbidden") {
			throw redirect({ href: "/feed" });
		}

		return {
			actor: data.actor,
			members: data.members,
		};
	},
});

function MembersRoute() {
	return <MembersPageView {...Route.useLoaderData()} />;
}
