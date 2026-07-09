import type { UserRole } from "./roles";

export type SessionTokensInput = {
	email: string;
	provider: string;
	role: UserRole;
	userId: number;
};
