import type { AccessTokenPayload } from "@/core/auth/model/TokenPayload";

export interface VerifyAccessTokenUseCase {
	verifyAccessToken(token: string): Promise<AccessTokenPayload | null>;
}
