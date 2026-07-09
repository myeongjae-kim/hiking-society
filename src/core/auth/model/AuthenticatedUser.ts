import type { UserRole } from "./roles";

export type AuthenticatedUser = {
	displayName: string | null;
	email: string;
	id: number;
	lastLoginAt: Date | null;
	name: string | null;
	provider: string | null;
	profileImageUrl: string | null;
	role: UserRole;
};
