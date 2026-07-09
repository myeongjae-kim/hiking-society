import type { AuthenticatedUser } from "./AuthenticatedUser";
import type { SessionTokensInput } from "./SessionTokensInput";

export type LoginWithGoogleCodeResult = {
	session: SessionTokensInput;
	user: AuthenticatedUser;
};
