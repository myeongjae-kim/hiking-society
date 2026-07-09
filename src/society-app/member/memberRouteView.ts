import type { CurrentUserContract, MemberContract } from "#/api/contracts";
import type { AuthenticatedUser } from "@/core/auth/model/AuthenticatedUser";
import type { MemberListItem } from "@/core/member/model/MemberListItem";

export type MemberManagementActorContract = Pick<
	CurrentUserContract,
	"id" | "role"
>;

export function toMemberManagementActorContract(
	user: AuthenticatedUser,
): MemberManagementActorContract {
	return {
		id: user.id,
		role: user.role,
	};
}

export function toMemberContract(member: MemberListItem): MemberContract {
	return {
		createdAt: member.createdAt.toISOString(),
		displayName: member.displayName,
		email: member.email,
		id: member.id,
		lastLoginAt: member.lastLoginAt?.toISOString() ?? null,
		name: member.name,
		provider: member.provider,
		role: member.role,
	};
}
