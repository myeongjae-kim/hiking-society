import { createServerFn } from "@tanstack/react-start";
import { readCurrentUser } from "#/app-features/auth/session.functions";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

export const getMembersRouteData = createServerFn({ method: "GET" }).handler(
	async () => {
		const actor = await readCurrentUser();

		if (!actor) {
			return { status: "unauthenticated" as const };
		}

		const data = await applicationUseCaseContext()
			.get("GetMemberManagementUseCase")
			.get({ actor });

		if (data.status === "forbidden") {
			return { status: "forbidden" as const };
		}

		return {
			actor: data.actor,
			members: data.members,
			status: "ok" as const,
		};
	},
);
