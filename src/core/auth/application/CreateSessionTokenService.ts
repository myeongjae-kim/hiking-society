import { Autowired } from "@/core/config/Autowired";
import type { CookieConfig } from "../config/CookieConfig";
import type { SessionTokensInput } from "../model/SessionTokensInput";
import type { CreateSessionTokenUseCase } from "./port/in/CreateSessionTokenUseCase";
import type { TokenCodecPort } from "./port/out/TokenCodecPort";

export class CreateSessionTokenService implements CreateSessionTokenUseCase {
	constructor(
		@Autowired("CookieConfig")
		private cookieConfig: CookieConfig,
		@Autowired("TokenCodecPort")
		private tokenCodecPort: TokenCodecPort,
	) {}

	async create(
		input: SessionTokensInput,
	): Promise<{ accessToken: string; refreshToken: string }> {
		const [accessToken, refreshToken] = await Promise.all([
			this.tokenCodecPort.signAccessToken({
				maxAgeSeconds: this.cookieConfig.accessTokenMaxAgeSeconds,
				payload: {
					email: input.email,
					provider: input.provider,
					role: input.role,
					type: "access",
					userId: input.userId,
				},
			}),
			this.tokenCodecPort.signRefreshToken({
				maxAgeSeconds: this.cookieConfig.refreshTokenMaxAgeSeconds,
				payload: {
					type: "refresh",
					userId: input.userId,
				},
			}),
		]);

		return { accessToken, refreshToken };
	}
}
