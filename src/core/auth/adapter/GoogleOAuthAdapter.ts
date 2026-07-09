import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { applicationError } from "@/core/common/application/ApplicationError";
import { Autowired } from "@/core/config/Autowired";
import type { GoogleOAuthPort } from "../application/port/out/GoogleOAuthPort";
import type { GoogleAccountPayload } from "../model/GoogleAccountPayload";

export class GoogleOAuthAdapter implements GoogleOAuthPort {
	constructor(
		@Autowired("GOOGLE_LOGIN_CLIENT_ID")
		private clientId: string,
		@Autowired("GOOGLE_LOGIN_CLIENT_SECRET")
		private clientSecret: string,
	) {}

	async verifyCode(code: string): Promise<GoogleAccountPayload> {
		const client = new OAuth2Client(
			this.clientId,
			this.clientSecret,
			"postmessage",
		);
		const { tokens } = await client.getToken(code);

		if (!tokens.id_token) {
			throw applicationError.unauthorized(
				"Google 계정 정보를 확인하지 못했습니다.",
			);
		}

		const ticket = await client.verifyIdToken({
			audience: this.clientId,
			idToken: tokens.id_token,
		});
		const payload = ticket.getPayload();

		if (!payload?.sub || !payload.email) {
			throw applicationError.unauthorized(
				"Google 계정 정보를 확인하지 못했습니다.",
			);
		}

		return {
			displayName: this.getDisplayName(payload),
			email: payload.email,
			emailVerified: payload.email_verified ?? false,
			profileImageUrl: payload.picture ?? null,
			provider: "google",
			providerUserId: payload.sub,
			rawClaims: this.toRawClaims(payload),
		};
	}

	private getDisplayName(payload: Pick<TokenPayload, "email" | "name">) {
		return payload.name ?? payload.email ?? "Google user";
	}

	private toRawClaims(payload: object) {
		return JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
	}
}
