import type { GoogleAccountPayload } from "@/core/auth/model/GoogleAccountPayload";

export interface GoogleOAuthPort {
	verifyCode(code: string): Promise<GoogleAccountPayload>;
}
