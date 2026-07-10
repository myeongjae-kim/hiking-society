import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getUseCase } from "#/infrastructure/config/getUseCase";
import { getLoginRedirectHref } from "#/society/auth/session.shared";
import MembersPageView from "#/society/member/MemberManagementPageView";
import { readCurrentUser } from "#/society-app/auth/session.functions";

const getMembersRouteData = createServerFn({ method: "GET" }).handler(
	async () => {
		const actor = await readCurrentUser();

		if (!actor) {
			return { status: "unauthenticated" as const };
		}

		const data = await getUseCase("GetMemberManagementUseCase").get({
			actor,
		});

		if (data.status === "forbidden") {
			return { status: "forbidden" as const };
		}

		return {
			actor: {
				id: data.actor.id,
				role: data.actor.role,
			},
			members: data.members,
			status: "ok" as const,
		};
	},
);

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
