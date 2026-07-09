import type { UserRole } from "./roles";
import type { SessionTokensInput } from "./SessionTokensInput";

export type LoginWithGoogleCodeResult = {
	session: SessionTokensInput;
	user: {
		email: string;
		id: number;
		role: UserRole;
	};
};
