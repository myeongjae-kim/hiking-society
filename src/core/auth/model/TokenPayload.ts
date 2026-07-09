import type { UserRole } from "./roles";

type TokenBase = {
	exp: number;
	iat: number;
	userId: number;
};

export type AccessTokenPayload = TokenBase & {
	email: string;
	provider: string;
	role: UserRole;
	type: "access";
};

export type RefreshTokenPayload = TokenBase & {
	type: "refresh";
};
