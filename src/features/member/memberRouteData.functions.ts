import { createServerFn } from "@tanstack/react-start";
import { readCurrentUser } from "#/features/auth/session.functions";
import { canManageMembers } from "@/core/auth/model/roles";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

export const getMembersRouteData = createServerFn({ method: "GET" }).handler(
	async () => {
		const actor = await readCurrentUser();

		if (!actor) {
			return { status: "unauthenticated" as const };
		}

		if (!canManageMembers(actor.role)) {
			return { status: "forbidden" as const };
		}

		return {
			actor,
			members: await applicationUseCaseContext()
				.get("ListMembersUseCase")
				.list(),
			status: "ok" as const,
		};
	},
);
