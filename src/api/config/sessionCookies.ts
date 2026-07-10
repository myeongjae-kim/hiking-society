import type { GetCookieOptionsUseCase } from "@/core/auth/application/port/in/GetCookieOptionsUseCase";
import { sessionCookieConfig } from "@/core/auth/config/sessionCookieConfig";

export { sessionCookieConfig };

export type CookieOptionsFactory = (
	maxAge: number,
) => ReturnType<GetCookieOptionsUseCase["getCookieOptions"]>;

export function createCookieOptions(deps: {
	readonly getCookieOptionsUseCase: GetCookieOptionsUseCase;
}): CookieOptionsFactory {
	return (maxAge) => deps.getCookieOptionsUseCase.getCookieOptions(maxAge);
}
