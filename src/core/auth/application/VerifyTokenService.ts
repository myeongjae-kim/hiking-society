import { type JWTPayload, jwtVerify } from "jose";
import { applicationError } from "@/core/common/application/ApplicationError";
import { Autowired } from "@/core/config/Autowired";
import type {
	AccessTokenPayload,
	RefreshTokenPayload,
} from "../model/TokenPayload";
import type { VerifyAccessTokenUseCase } from "./port/in/VerifyAccessTokenUseCase";
import type { VerifyRefreshTokenUseCase } from "./port/in/VerifyRefreshTokenUseCase";

export class VerifyTokenService
	implements VerifyAccessTokenUseCase, VerifyRefreshTokenUseCase
{
	constructor(
		@Autowired("TextEncoder")
		private encoder: TextEncoder,
		@Autowired("JWT_SECRET")
		private JWT_SECRET: string,
	) {}

	verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
		return this.verifyJwt<AccessTokenPayload>(token, "access");
	}

	verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
		return this.verifyJwt<RefreshTokenPayload>(token, "refresh");
	}

	private async verifyJwt<T extends AccessTokenPayload | RefreshTokenPayload>(
		token: string,
		type: T["type"],
	) {
		try {
			const { payload } = await jwtVerify(token, this.getSigningKey(), {
				algorithms: ["HS256"],
			});

			if (type === "access" && this.isAccessTokenPayload(payload)) {
				return payload as T;
			}

			if (type === "refresh" && this.isRefreshTokenPayload(payload)) {
				return payload as T;
			}
		} catch {
			return null;
		}

		return null;
	}

	private getSigningKey() {
		const jwtSecret = this.JWT_SECRET;

		if (!jwtSecret) {
			throw applicationError.internal("서버 인증 설정이 올바르지 않습니다.");
		}

		return this.encoder.encode(jwtSecret);
	}

	private isAccessTokenPayload(
		payload: JWTPayload,
	): payload is AccessTokenPayload {
		return (
			payload.type === "access" &&
			typeof payload.userId === "number" &&
			typeof payload.email === "string" &&
			typeof payload.provider === "string" &&
			typeof payload.role === "string"
		);
	}

	private isRefreshTokenPayload(
		payload: JWTPayload,
	): payload is RefreshTokenPayload {
		return payload.type === "refresh" && typeof payload.userId === "number";
	}
}
