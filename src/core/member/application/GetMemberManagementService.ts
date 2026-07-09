import { UserRolePolicy } from "@/core/auth/model/roles";
import type { TransactionPort } from "@/core/common/application/port/out/TransactionPort";
import { Autowired } from "@/core/config/Autowired";
import type { GetMemberManagementUseCase } from "./port/in/GetMemberManagementUseCase";
import type { ListMembersUseCase } from "./port/in/ListMembersUseCase";

export class GetMemberManagementService implements GetMemberManagementUseCase {
	constructor(
		@Autowired("ListMembersUseCase")
		private listMembersUseCase: ListMembersUseCase,
		@Autowired("TransactionPort")
		private transactionPort: TransactionPort,
	) {}

	async get(input: Parameters<GetMemberManagementUseCase["get"]>[0]) {
		if (!UserRolePolicy.of(input.actor.role).canManageMembers()) {
			return { status: "forbidden" as const };
		}

		return this.transactionPort.run(async () => {
			return {
				actor: input.actor,
				members: await this.listMembersUseCase.list(),
				status: "ok" as const,
			};
		});
	}
}
