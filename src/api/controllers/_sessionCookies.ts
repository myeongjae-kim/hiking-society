import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";
export { sessionCookieConfig } from "@/core/auth/config/sessionCookieConfig";

export function cookieOptions(maxAge: number) {
	return applicationUseCaseContext()
		.get("GetCookieOptionsUseCase")
		.getCookieOptions(maxAge);
}
