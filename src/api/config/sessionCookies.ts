import { sessionCookieConfig } from "@/core/auth/config/sessionCookieConfig";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

export { sessionCookieConfig };

export function cookieOptions(maxAge: number) {
	return applicationUseCaseContext()
		.get("GetCookieOptionsUseCase")
		.getCookieOptions(maxAge);
}
