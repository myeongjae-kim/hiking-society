import { getUseCase } from "#/core/config/getUseCase";
import { getWebtuiTheme, WEBTUI_THEME_COOKIE_NAME } from "#/theme/webtuiThemes";
import type { CreateSessionTokenUseCase } from "@/core/auth/application/port/in/CreateSessionTokenUseCase";
import type { GetCookieOptionsUseCase } from "@/core/auth/application/port/in/GetCookieOptionsUseCase";
import type {
	RefreshedSessionTokens,
	ResolveSessionUseCase,
} from "@/core/auth/application/port/in/ResolveSessionUseCase";
import { sessionCookieConfig } from "@/core/auth/config/sessionCookieConfig";
import type { AuthenticatedUser } from "@/core/auth/model/AuthenticatedUser";
import type { UserRole } from "@/core/auth/model/roles";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";

type SessionCookieWriterDeps = {
	readonly getCookieOptionsUseCase: GetCookieOptionsUseCase;
};

type SetSessionCookiesDeps = SessionCookieWriterDeps & {
	readonly createSessionTokenUseCase: CreateSessionTokenUseCase;
};

type ReadCurrentUserDeps = SessionCookieWriterDeps & {
	readonly resolveSessionUseCase: ResolveSessionUseCase;
};

type ReadCurrentTheme = () => Promise<string>;
type ReadCurrentUser = () => Promise<AuthenticatedUser | null>;

export function createReadCurrentTheme(): ReadCurrentTheme {
	return createServerOnlyFn(async () => {
		const { getCookie } = await import("@tanstack/react-start/server");

		return getWebtuiTheme(getCookie(WEBTUI_THEME_COOKIE_NAME));
	});
}

export function createGetCurrentTheme(deps: {
	readonly readCurrentTheme: ReadCurrentTheme;
}) {
	return createServerFn({ method: "GET" }).handler(
		async () => await deps.readCurrentTheme(),
	);
}

function createWriteSessionCookies({
	getCookieOptionsUseCase,
}: SessionCookieWriterDeps) {
	return async (tokens: RefreshedSessionTokens) => {
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
			getCookieOptionsUseCase.getCookieOptions(accessTokenMaxAgeSeconds),
		);
		setCookie(
			refreshTokenCookieName,
			tokens.refreshToken,
			getCookieOptionsUseCase.getCookieOptions(refreshTokenMaxAgeSeconds),
		);
	};
}

export function createSetSessionCookies({
	createSessionTokenUseCase,
	getCookieOptionsUseCase,
}: SetSessionCookiesDeps) {
	const writeSessionCookies = createWriteSessionCookies({
		getCookieOptionsUseCase,
	});

	return createServerOnlyFn(
		async (input: {
			email: string;
			provider: string;
			role: UserRole;
			userId: number;
		}) => {
			const tokens = await createSessionTokenUseCase.create(input);

			await writeSessionCookies(tokens);
		},
	);
}

export const clearSessionCookies = createServerOnlyFn(async () => {
	const { deleteCookie } = await import("@tanstack/react-start/server");
	const { accessTokenCookieName, refreshTokenCookieName } = sessionCookieConfig;

	deleteCookie(accessTokenCookieName, { path: "/" });
	deleteCookie(refreshTokenCookieName, { path: "/" });
});

export function createReadCurrentUser({
	getCookieOptionsUseCase,
	resolveSessionUseCase,
}: ReadCurrentUserDeps): ReadCurrentUser {
	const writeSessionCookies = createWriteSessionCookies({
		getCookieOptionsUseCase,
	});

	return createServerOnlyFn(async () => {
		const { getCookie } = await import("@tanstack/react-start/server");
		const { accessTokenCookieName, refreshTokenCookieName } =
			sessionCookieConfig;
		const result = await resolveSessionUseCase.resolve({
			accessToken: getCookie(accessTokenCookieName),
			refreshToken: getCookie(refreshTokenCookieName),
		});

		if (result.refreshedTokens) {
			await writeSessionCookies(result.refreshedTokens);
		}

		return result.user;
	});
}

export function createGetCurrentUser(deps: {
	readonly readCurrentUser: ReadCurrentUser;
}) {
	return createServerFn({ method: "GET" }).handler(
		async () => await deps.readCurrentUser(),
	);
}

const createSessionTokenUseCase = getUseCase("CreateSessionTokenUseCase");
const getCookieOptionsUseCase = getUseCase("GetCookieOptionsUseCase");
const resolveSessionUseCase = getUseCase("ResolveSessionUseCase");

export const readCurrentTheme = createReadCurrentTheme();
export const getCurrentTheme = createGetCurrentTheme({ readCurrentTheme });
export const setSessionCookies = createSetSessionCookies({
	createSessionTokenUseCase,
	getCookieOptionsUseCase,
});
export const readCurrentUser = createReadCurrentUser({
	getCookieOptionsUseCase,
	resolveSessionUseCase,
});
export const getCurrentUser = createGetCurrentUser({ readCurrentUser });
