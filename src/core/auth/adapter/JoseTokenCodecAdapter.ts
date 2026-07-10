import { type JWTPayload, jwtVerify, SignJWT } from "jose";
import type { TokenCodecPort } from "@/core/auth/application/port/out/TokenCodecPort";
import type {
	AccessTokenPayload,
	RefreshTokenPayload,
} from "@/core/auth/model/TokenPayload";
import { applicationError } from "@/core/common/application/ApplicationError";
import { Autowired } from "@/core/config/Autowired";

export class JoseTokenCodecAdapter implements TokenCodecPort {
	constructor(
		@Autowired("TextEncoder")
		private encoder: TextEncoder,
		@Autowired("JWT_SECRET")
		private JWT_SECRET: string,
	) {}

	signAccessToken(input: {
		maxAgeSeconds: number;
		payload: Omit<AccessTokenPayload, "exp" | "iat">;
	}) {
		return this.signJwt(input.payload, input.maxAgeSeconds);
	}

	signRefreshToken(input: {
		maxAgeSeconds: number;
		payload: Omit<RefreshTokenPayload, "exp" | "iat">;
	}) {
		return this.signJwt(input.payload, input.maxAgeSeconds);
	}

	verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
		return this.verifyJwt<AccessTokenPayload>(token, "access");
	}

	verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
		return this.verifyJwt<RefreshTokenPayload>(token, "refresh");
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
		maxAgeSeconds: number,
	) {
		return new SignJWT(payload)
			.setProtectedHeader({ alg: "HS256", typ: "JWT" })
			.setIssuedAt()
			.setExpirationTime(`${maxAgeSeconds}s`)
			.sign(this.getSigningKey());
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
