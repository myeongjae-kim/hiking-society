import { Autowired } from "@/core/config/Autowired";
import type {
	AccessTokenPayload,
	RefreshTokenPayload,
} from "../model/TokenPayload";
import type { VerifyAccessTokenUseCase } from "./port/in/VerifyAccessTokenUseCase";
import type { VerifyRefreshTokenUseCase } from "./port/in/VerifyRefreshTokenUseCase";
import type { TokenCodecPort } from "./port/out/TokenCodecPort";

export class VerifyTokenService
	implements VerifyAccessTokenUseCase, VerifyRefreshTokenUseCase
{
	constructor(
		@Autowired("TokenCodecPort")
		private tokenCodecPort: TokenCodecPort,
	) {}

	verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
		return this.tokenCodecPort.verifyAccessToken(token);
	}

	verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
		return this.tokenCodecPort.verifyRefreshToken(token);
	}
}
