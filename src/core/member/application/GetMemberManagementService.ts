import { UserRolePolicy } from "@/core/auth/model/roles";
import { Autowired } from "@/core/config/Autowired";
import type { GetMemberManagementUseCase } from "./port/in/GetMemberManagementUseCase";
import type { ListMembersUseCase } from "./port/in/ListMembersUseCase";

export class GetMemberManagementService implements GetMemberManagementUseCase {
	constructor(
		@Autowired("ListMembersUseCase")
		private listMembersUseCase: ListMembersUseCase,
	) {}

	async get(input: Parameters<GetMemberManagementUseCase["get"]>[0]) {
		if (!UserRolePolicy.of(input.actor.role).canManageMembers()) {
			return { status: "forbidden" as const };
		}

		return {
			actor: input.actor,
			members: await this.listMembersUseCase.list(),
			status: "ok" as const,
		};
	}
}
