import { createServerFn } from "@tanstack/react-start";
import { readCurrentUser } from "#/society-app/auth/session.functions";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";
import {
	toMemberContract,
	toMemberManagementActorContract,
} from "./memberRouteContracts";

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
			actor: toMemberManagementActorContract(data.actor),
			members: data.members.map(toMemberContract),
			status: "ok" as const,
		};
	},
);
