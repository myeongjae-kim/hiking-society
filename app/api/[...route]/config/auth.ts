import type { AuthenticatedUser } from '@/core/auth/model/AuthenticatedUser';
import type { UserRole } from '@/core/auth/model/roles';
import { applicationContext } from '@/core/config/applicationContext';
import type { Context } from 'hono';
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
  const accessPayload = accessToken
    ? await applicationContext().get('VerifyAccessTokenUseCase').verifyAccessToken(accessToken)
    : null;

  if (!accessPayload) {
    return null;
  }

  return applicationContext().get('AuthQueryPort').getUserByUserId(accessPayload.userId);
}

async function refreshApiAccessToken(c: Context) {
  const refreshToken = getCookie(c, refreshTokenCookieName);
  const refreshPayload = refreshToken
    ? await applicationContext().get('VerifyRefreshTokenUseCase').verifyRefreshToken(refreshToken)
    : null;

  if (!refreshPayload) {
    return null;
  }

  const session = await applicationContext()
    .get('AuthQueryPort')
    .getSessionSnapshotByUserId(refreshPayload.userId);

  if (!session) {
    return null;
  }

  const { accessToken } = await applicationContext().get('CreateSessionTokenUseCase').create({
    email: session.email,
    provider: session.provider,
    role: session.role,
    userId: session.userId,
  });
  const options = applicationContext()
    .get('GetCookieOptionsUseCase')
    .getCookieOptions(accessTokenMaxAgeSeconds);

  setCookie(c, accessTokenCookieName, accessToken, options);

  return getUserByToken(accessToken);
}

export const authMiddleware = createMiddleware<{ Variables: ApiVariables }>(async (c, next) => {
  let user = await getUserByToken(getCookie(c, accessTokenCookieName));

  if (!user) {
    user = await refreshApiAccessToken(c);
  }

  if (!user && !isPublicRoute(c.req.method, c.req.path)) {
    throw unauthorized();
  }

  c.set('currentUser', user);

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
