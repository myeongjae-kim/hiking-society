import type { AuthenticatedUser } from "@/core/auth/model/AuthenticatedUser";
import type { GoogleAccountPayload } from "@/core/auth/model/GoogleAccountPayload";

export interface AuthCommandPort {
	upsertGoogleAccount(input: {
		now: Date;
		payload: GoogleAccountPayload;
	}): Promise<AuthenticatedUser>;
}
