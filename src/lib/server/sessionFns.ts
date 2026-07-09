import { getSafeRedirectTarget } from '@/app/auth/utils/redirectTarget';
import { getWebtuiTheme, WEBTUI_THEME_COOKIE_NAME } from '@/app/common/theme/webtuiThemes';
import type { UserRole } from '@/core/auth/model/roles';
import { createServerFn, createServerOnlyFn } from '@tanstack/react-start';

async function getApplicationContext() {
  const { applicationContext } = await import('@/core/config/applicationContext');

  return applicationContext();
}

async function getCookieConfig() {
  return (await getApplicationContext()).get('CookieConfig');
}

export const readCurrentTheme = createServerOnlyFn(async () => {
  const { getCookie } = await import('@tanstack/react-start/server');

  return getWebtuiTheme(getCookie(WEBTUI_THEME_COOKIE_NAME));
});

export const getCurrentTheme = createServerFn({ method: 'GET' }).handler(
  async () => await readCurrentTheme(),
);

export const setSessionCookies = createServerOnlyFn(
  async (input: { email: string; provider: string; role: UserRole; userId: number }) => {
    const { setCookie } = await import('@tanstack/react-start/server');
    const context = await getApplicationContext();
    const {
      accessTokenCookieName,
      accessTokenMaxAgeSeconds,
      refreshTokenCookieName,
      refreshTokenMaxAgeSeconds,
    } = context.get('CookieConfig');
    const { accessToken, refreshToken } = await context
      .get('CreateSessionTokenUseCase')
      .create(input);
    const getCookieOptionsUseCase = context.get('GetCookieOptionsUseCase');

    setCookie(
      accessTokenCookieName,
      accessToken,
      getCookieOptionsUseCase.getCookieOptions(accessTokenMaxAgeSeconds),
    );
    setCookie(
      refreshTokenCookieName,
      refreshToken,
      getCookieOptionsUseCase.getCookieOptions(refreshTokenMaxAgeSeconds),
    );
  },
);

export const clearSessionCookies = createServerOnlyFn(async () => {
  const { deleteCookie } = await import('@tanstack/react-start/server');
  const { accessTokenCookieName, refreshTokenCookieName } = await getCookieConfig();

  deleteCookie(accessTokenCookieName, { path: '/' });
  deleteCookie(refreshTokenCookieName, { path: '/' });
});

export const readCurrentUser = createServerOnlyFn(async () => {
  const { getCookie } = await import('@tanstack/react-start/server');
  const context = await getApplicationContext();
  const { accessTokenCookieName, refreshTokenCookieName } = context.get('CookieConfig');
  const accessToken = getCookie(accessTokenCookieName);
  const refreshToken = getCookie(refreshTokenCookieName);
  const accessPayload = accessToken
    ? await context.get('VerifyAccessTokenUseCase').verifyAccessToken(accessToken)
    : null;
  const refreshPayload = refreshToken
    ? await context.get('VerifyRefreshTokenUseCase').verifyRefreshToken(refreshToken)
    : null;
  const userId = accessPayload?.userId ?? refreshPayload?.userId;

  if (!userId) {
    return null;
  }

  const user = await context.get('AuthQueryPort').getUserByUserId(userId);

  if (!user || !user.email) {
    return null;
  }

  if (!accessPayload && refreshPayload && user.provider) {
    await setSessionCookies({
      email: user.email,
      provider: user.provider,
      role: user.role,
      userId: user.id,
    });
  }

  return user;
});

export const getCurrentUser = createServerFn({ method: 'GET' }).handler(
  async () => await readCurrentUser(),
);

export function getLoginRedirectHref(currentHref: string) {
  const url = new URL('/', 'http://localhost');

  url.searchParams.set('next', currentHref);

  return `${url.pathname}${url.search}`;
}

export function getAuthenticatedHomeRedirectHref(value: string | undefined) {
  return getSafeRedirectTarget(value);
}
