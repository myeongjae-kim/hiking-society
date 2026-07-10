import { getUseCase } from "#/infrastructure/config/getUseCase";
import { readCurrentUser } from "#/society-app/auth/session.functions";
import type { GetMemberManagementUseCase } from "@/core/member/application/port/in/GetMemberManagementUseCase";
import { createServerFn } from "@tanstack/react-start";

type GetMembersRouteDataDeps = {
	readonly getMemberManagementUseCase: GetMemberManagementUseCase;
	readonly readCurrentUser: typeof readCurrentUser;
};

async function getMembersRouteDataHandler({
	getMemberManagementUseCase,
	readCurrentUser,
}: GetMembersRouteDataDeps) {
	const actor = await readCurrentUser();

	if (!actor) {
		return { status: "unauthenticated" as const };
	}

	const data = await getMemberManagementUseCase.get({ actor });

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
}

export const getMembersRouteData = createServerFn({ method: "GET" }).handler(
	async () =>
		getMembersRouteDataHandler({
			getMemberManagementUseCase: getUseCase("GetMemberManagementUseCase"),
			readCurrentUser,
		}),
);
