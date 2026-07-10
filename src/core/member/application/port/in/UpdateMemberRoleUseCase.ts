import type { UserRole } from "@/core/auth/model/roles";

export interface UpdateMemberRoleUseCase {
	update(input: {
		actorRole: UserRole;
		nextRole: UserRole;
		userId: number;
	}): Promise<void>;
}
