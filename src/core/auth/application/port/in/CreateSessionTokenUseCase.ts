import type { SessionTokensInput } from "@/core/auth/model/SessionTokensInput";

export interface CreateSessionTokenUseCase {
	create(
		input: SessionTokensInput,
	): Promise<{ accessToken: string; refreshToken: string }>;
}
