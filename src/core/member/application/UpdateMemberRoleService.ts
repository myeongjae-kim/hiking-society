import { canChangeRole } from "@/core/auth/model/roles";
import { applicationError } from "@/core/common/application/ApplicationError";
import { Autowired } from "@/core/config/Autowired";
import type { UpdateMemberRoleUseCase } from "./port/in/UpdateMemberRoleUseCase";
import type { MemberCommandPort } from "./port/out/MemberCommandPort";
import type { MemberQueryPort } from "./port/out/MemberQueryPort";

export class UpdateMemberRoleService implements UpdateMemberRoleUseCase {
	constructor(
		@Autowired("MemberQueryPort")
		private memberQueryPort: MemberQueryPort,
		@Autowired("MemberCommandPort")
		private memberCommandPort: MemberCommandPort,
	) {}

	async update(input: Parameters<UpdateMemberRoleUseCase["update"]>[0]) {
		const targetRole = await this.memberQueryPort.findActiveMemberRoleById(
			input.userId,
		);

		if (!targetRole) {
			throw applicationError.notFound("회원을 찾을 수 없습니다.");
		}

		if (!canChangeRole(input.actorRole, targetRole, input.nextRole)) {
			throw applicationError.forbidden("이 회원 권한을 변경할 수 없습니다.");
		}

		await this.memberCommandPort.updateActiveMemberRole({
			nextRole: input.nextRole,
			now: input.now,
			userId: input.userId,
		});
	}
}
