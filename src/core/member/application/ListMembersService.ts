import type { TransactionPort } from "@/core/common/application/port/out/TransactionPort";
import { Autowired } from "@/core/config/Autowired";
import type { MemberListItem } from "../model/MemberListItem";
import type { ListMembersUseCase } from "./port/in/ListMembersUseCase";
import type { MemberQueryPort } from "./port/out/MemberQueryPort";

export class ListMembersService implements ListMembersUseCase {
	constructor(
		@Autowired("MemberQueryPort")
		private memberQueryPort: MemberQueryPort,
		@Autowired("TransactionPort")
		private transactionPort: TransactionPort,
	) {}

	list(): Promise<MemberListItem[]> {
		return this.transactionPort.run(() =>
			this.memberQueryPort.listActiveMembers(),
		);
	}
}
