import type {
	AccessTokenPayload,
	RefreshTokenPayload,
} from "@/core/auth/model/TokenPayload";

export interface TokenCodecPort {
	signAccessToken(input: {
		maxAgeSeconds: number;
		payload: Omit<AccessTokenPayload, "exp" | "iat">;
	}): Promise<string>;
	signRefreshToken(input: {
		maxAgeSeconds: number;
		payload: Omit<RefreshTokenPayload, "exp" | "iat">;
	}): Promise<string>;
	verifyAccessToken(token: string): Promise<AccessTokenPayload | null>;
	verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null>;
}
