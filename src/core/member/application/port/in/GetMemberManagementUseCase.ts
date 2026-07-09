import type { AuthenticatedUser } from "@/core/auth/model/AuthenticatedUser";
import type { MemberManagementResult } from "@/core/member/model/MemberManagement";

export interface GetMemberManagementUseCase {
	get(input: {
		readonly actor: AuthenticatedUser;
	}): Promise<MemberManagementResult>;
}
