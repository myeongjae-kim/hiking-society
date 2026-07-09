import type { AuthenticatedUser } from "@/core/auth/model/AuthenticatedUser";

export type RefreshedSessionTokens = {
	readonly accessToken: string;
	readonly refreshToken: string;
};

export type ResolveSessionResult = {
	readonly refreshedTokens: RefreshedSessionTokens | null;
	readonly user: AuthenticatedUser | null;
};

export interface ResolveSessionUseCase {
	resolve(input: {
		accessToken?: string | null;
		refreshToken?: string | null;
	}): Promise<ResolveSessionResult>;
}
