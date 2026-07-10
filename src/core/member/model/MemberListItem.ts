import type { UserRole } from "@/core/auth/model/roles";
import type { IsoDateTimeString } from "@/core/common/domain";

export type MemberListItem = {
	createdAt: IsoDateTimeString;
	displayName: string | null;
	email: string | null;
	id: number;
	lastLoginAt: IsoDateTimeString | null;
	name: string | null;
	provider: string | null;
	role: UserRole;
};
