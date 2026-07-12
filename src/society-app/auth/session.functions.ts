import { env } from "#/config/env.server";
import { getUseCase } from "#/infrastructure/config/getUseCase";
import { getWebtuiTheme, WEBTUI_THEME_COOKIE_NAME } from "#/theme/webtuiThemes";
import type { RefreshedSessionTokens } from "@/core/auth/application/port/in/ResolveSessionUseCase";
import { sessionCookieConfig } from "@/core/auth/config/sessionCookieConfig";
import { createSessionCookieOptionsFactory } from "@/core/auth/config/sessionCookieOptions";
import type { AuthenticatedUser } from "@/core/auth/model/AuthenticatedUser";
import type { UserRole } from "@/core/auth/model/roles";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";

type ReadCurrentTheme = () => Promise<string>;
type ReadCurrentUser = () => Promise<AuthenticatedUser | null>;
const getSessionCookieOptions = createSessionCookieOptionsFactory(
	env.NODE_ENV,
);

async function writeSessionCookies(tokens: RefreshedSessionTokens) {
	const { setCookie } = await import("@tanstack/react-start/server");
	const {
		accessTokenCookieName,
		accessTokenMaxAgeSeconds,
		refreshTokenCookieName,
		refreshTokenMaxAgeSeconds,
	} = sessionCookieConfig;

	setCookie(
		accessTokenCookieName,
		tokens.accessToken,
		getSessionCookieOptions(accessTokenMaxAgeSeconds),
	);
	setCookie(
		refreshTokenCookieName,
		tokens.refreshToken,
		getSessionCookieOptions(refreshTokenMaxAgeSeconds),
	);
}

export const readCurrentTheme: ReadCurrentTheme = createServerOnlyFn(
	async () => {
		const { getCookie } = await import("@tanstack/react-start/server");

		return getWebtuiTheme(getCookie(WEBTUI_THEME_COOKIE_NAME));
	},
);

export const getCurrentTheme = createServerFn({ method: "GET" }).handler(
	async () => await readCurrentTheme(),
);

export const setSessionCookies = createServerOnlyFn(
	async (input: {
		email: string;
		provider: string;
		role: UserRole;
		userId: number;
	}) => {
		const createSessionTokenUseCase = getUseCase("CreateSessionTokenUseCase");
		const tokens = await createSessionTokenUseCase.create(input);

		await writeSessionCookies(tokens);
	},
);

export const clearSessionCookies = createServerOnlyFn(async () => {
	const { deleteCookie } = await import("@tanstack/react-start/server");
	const { accessTokenCookieName, refreshTokenCookieName } = sessionCookieConfig;

	deleteCookie(accessTokenCookieName, { path: "/" });
	deleteCookie(refreshTokenCookieName, { path: "/" });
});

export const readCurrentUser: ReadCurrentUser = createServerOnlyFn(async () => {
	const { getCookie } = await import("@tanstack/react-start/server");
	const resolveSessionUseCase = getUseCase("ResolveSessionUseCase");
	const { accessTokenCookieName, refreshTokenCookieName } = sessionCookieConfig;
	const result = await resolveSessionUseCase.resolve({
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
