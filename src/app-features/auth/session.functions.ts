import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getWebtuiTheme, WEBTUI_THEME_COOKIE_NAME } from "#/theme/webtuiThemes";
import type { RefreshedSessionTokens } from "@/core/auth/application/port/in/ResolveSessionUseCase";
import { sessionCookieConfig } from "@/core/auth/config/sessionCookieConfig";
import type { UserRole } from "@/core/auth/model/roles";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

export const readCurrentTheme = createServerOnlyFn(async () => {
	const { getCookie } = await import("@tanstack/react-start/server");

	return getWebtuiTheme(getCookie(WEBTUI_THEME_COOKIE_NAME));
});

export const getCurrentTheme = createServerFn({ method: "GET" }).handler(
	async () => await readCurrentTheme(),
);

async function writeSessionCookies(tokens: RefreshedSessionTokens) {
	const { setCookie } = await import("@tanstack/react-start/server");
	const services = applicationUseCaseContext();
	const {
		accessTokenCookieName,
		accessTokenMaxAgeSeconds,
		refreshTokenCookieName,
		refreshTokenMaxAgeSeconds,
	} = sessionCookieConfig;
	const getCookieOptionsUseCase = services.get("GetCookieOptionsUseCase");

	setCookie(
		accessTokenCookieName,
		tokens.accessToken,
		getCookieOptionsUseCase.getCookieOptions(accessTokenMaxAgeSeconds),
	);
	setCookie(
		refreshTokenCookieName,
		tokens.refreshToken,
		getCookieOptionsUseCase.getCookieOptions(refreshTokenMaxAgeSeconds),
	);
}

export const setSessionCookies = createServerOnlyFn(
	async (input: {
		email: string;
		provider: string;
		role: UserRole;
		userId: number;
	}) => {
		const tokens = await applicationUseCaseContext()
			.get("CreateSessionTokenUseCase")
			.create(input);

		await writeSessionCookies(tokens);
	},
);

export const clearSessionCookies = createServerOnlyFn(async () => {
	const { deleteCookie } = await import("@tanstack/react-start/server");
	const { accessTokenCookieName, refreshTokenCookieName } = sessionCookieConfig;

	deleteCookie(accessTokenCookieName, { path: "/" });
	deleteCookie(refreshTokenCookieName, { path: "/" });
});

export const readCurrentUser = createServerOnlyFn(async () => {
	const { getCookie } = await import("@tanstack/react-start/server");
	const services = applicationUseCaseContext();
	const { accessTokenCookieName, refreshTokenCookieName } = sessionCookieConfig;
	const result = await services.get("ResolveSessionUseCase").resolve({
		accessToken: getCookie(accessTokenCookieName),
		refreshToken: getCookie(refreshTokenCookieName),
	});

	if (result.refreshedTokens) {
		await writeSessionCookies(result.refreshedTokens);
	}

	return result.user;
});

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
	async () => await readCurrentUser(),
);
