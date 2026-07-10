import type { IsoDateTimeString } from "@/core/common/domain";
import type { UserRole } from "./roles";

export type AuthenticatedUser = {
	displayName: string | null;
	email: string;
	id: number;
	lastLoginAt: IsoDateTimeString | null;
	name: string | null;
	provider: string | null;
	profileImageUrl: string | null;
	role: UserRole;
};
