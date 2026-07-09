import { SignJWT } from "jose";
import { applicationError } from "@/core/common/application/ApplicationError";
import { Autowired } from "@/core/config/Autowired";
import type { CookieConfig } from "../config/CookieConfig";
import type { SessionTokensInput } from "../model/SessionTokensInput";
import type {
	AccessTokenPayload,
	RefreshTokenPayload,
} from "../model/TokenPayload";
import type { CreateSessionTokenUseCase } from "./port/in/CreateSessionTokenUseCase";

export class CreateSessionTokenService implements CreateSessionTokenUseCase {
	constructor(
		@Autowired("TextEncoder")
		private encoder: TextEncoder,
		@Autowired("CookieConfig")
		private cookieConfig: CookieConfig,
		@Autowired("JWT_SECRET")
		private JWT_SECRET: string,
	) {}

	async create(
		input: SessionTokensInput,
	): Promise<{ accessToken: string; refreshToken: string }> {
		const [accessToken, refreshToken] = await Promise.all([
			this.signJwt(
				{
					email: input.email,
					provider: input.provider,
					role: input.role,
					type: "access",
					userId: input.userId,
				},
				this.cookieConfig.accessTokenMaxAgeSeconds,
			),
			this.signJwt(
				{
					type: "refresh",
					userId: input.userId,
				},
				this.cookieConfig.refreshTokenMaxAgeSeconds,
			),
		]);

		return { accessToken, refreshToken };
	}

	private getSigningKey() {
		const jwtSecret = this.JWT_SECRET;

		if (!jwtSecret) {
			throw applicationError.internal("서버 인증 설정이 올바르지 않습니다.");
		}

		return this.encoder.encode(jwtSecret);
	}

	private async signJwt(
		payload:
			| Omit<AccessTokenPayload, "exp" | "iat">
			| Omit<RefreshTokenPayload, "exp" | "iat">,
		maxAge: number,
	) {
		return new SignJWT(payload)
			.setProtectedHeader({ alg: "HS256", typ: "JWT" })
			.setIssuedAt()
			.setExpirationTime(`${maxAge}s`)
			.sign(this.getSigningKey());
	}
}
