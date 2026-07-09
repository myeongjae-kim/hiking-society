import type { AuthenticatedUser } from '@/core/auth/model/AuthenticatedUser';
import type { UserRole } from '@/core/auth/model/roles';
import { applicationContext } from '@/core/config/applicationContext.server';
import { getCookie, setCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { ApiError } from './ApiError';
import type { ApiVariables } from './Controller';

const { accessTokenCookieName, accessTokenMaxAgeSeconds, refreshTokenCookieName } =
  applicationContext().get('CookieConfig');

const publicRoutes: readonly [string, RegExp][] = [
  ['GET', /^\/api\/health$/],
  ['GET', /^\/api\/swagger$/],
  ['GET', /^\/api\/docs$/],
  ['POST', /^\/api\/auth\/google\/login$/],
  ['POST', /^\/api\/auth\/logout$/],
];

function isPublicRoute(method: string, path: string) {
  return publicRoutes.some(
    ([routeMethod, pattern]) => routeMethod === method && pattern.test(path),
  );
}

function unauthorized(message = '인증이 필요합니다.') {
  return new ApiError({ error: 'UNAUTHORIZED', message, status: 401 });
}

function forbidden(message = '권한이 없습니다.') {
  return new ApiError({ error: 'FORBIDDEN', message, status: 403 });
}

async function getUserByToken(accessToken: string | undefined) {
  return applicationContext()
    .get('ResolveSessionUseCase')
    .resolve({ accessToken, refreshToken: null });
}

export const authMiddleware = createMiddleware<{ Variables: ApiVariables }>(async (c, next) => {
  let session = await getUserByToken(getCookie(c, accessTokenCookieName));

  if (!session.user) {
    session = await applicationContext().get('ResolveSessionUseCase').resolve({
      accessToken: null,
      refreshToken: getCookie(c, refreshTokenCookieName),
    });
  }

  if (session.refreshedTokens) {
    const context = applicationContext();
    const { refreshTokenMaxAgeSeconds } = context.get('CookieConfig');
    const getCookieOptionsUseCase = context.get('GetCookieOptionsUseCase');

    setCookie(
      c,
      accessTokenCookieName,
      session.refreshedTokens.accessToken,
      getCookieOptionsUseCase.getCookieOptions(accessTokenMaxAgeSeconds),
    );
    setCookie(
      c,
      refreshTokenCookieName,
      session.refreshedTokens.refreshToken,
      getCookieOptionsUseCase.getCookieOptions(refreshTokenMaxAgeSeconds),
    );
  }

  if (!session.user && !isPublicRoute(c.req.method, c.req.path)) {
    throw unauthorized();
  }

  c.set('currentUser', session.user);

  return next();
});

export function requireApiUser(user: AuthenticatedUser | null) {
  if (!user) {
    throw unauthorized();
  }

  return user;
}

export function requireApiRole(user: AuthenticatedUser | null, allowedRoles: readonly UserRole[]) {
  const currentUser = requireApiUser(user);

  if (!allowedRoles.includes(currentUser.role)) {
    throw forbidden();
  }

  return currentUser;
}
