import type { UserRole } from "@/core/auth/model/roles";
import type { MemberListItem } from "@/core/member/model/MemberListItem";

export interface MemberQueryPort {
	findActiveMemberRoleById(userId: number): Promise<UserRole | null>;
	listActiveMembers(): Promise<MemberListItem[]>;
}
