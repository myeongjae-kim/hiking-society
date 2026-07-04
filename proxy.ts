import { NextResponse, type NextRequest } from 'next/server';
import { getSafeRedirectTarget } from './app/auth/utils/redirectTarget';
import { applicationContext } from './core/config/applicationContext';

const { accessTokenCookieName, accessTokenMaxAgeSeconds, refreshTokenCookieName } =
  applicationContext().get('CookieConfig');

const protectedPathPrefixes = ['/article', '/feed', '/me', '/members'];

function isProtectedPath(pathname: string) {
  return protectedPathPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function getCurrentPathWithSearch(request: NextRequest) {
  return `${request.nextUrl.pathname}${request.nextUrl.search}`;
}

function getHomeRedirectWithNext(request: NextRequest) {
  const url = new URL('/', request.url);

  url.searchParams.set('next', getCurrentPathWithSearch(request));

  return NextResponse.redirect(url);
}

function getAuthenticatedHomeRedirect(request: NextRequest) {
  return NextResponse.redirect(
    new URL(getSafeRedirectTarget(request.nextUrl.searchParams.get('next')), request.url),
  );
}

async function getValidAccessPayload(request: NextRequest) {
  const accessToken = request.cookies.get(accessTokenCookieName)?.value;

  if (!accessToken) {
    return null;
  }

  return applicationContext().get('VerifyAccessTokenUseCase').verifyAccessToken(accessToken);
}

async function issueAccessTokenFromRefreshToken(request: NextRequest, response: NextResponse) {
  const refreshToken = request.cookies.get(refreshTokenCookieName)?.value;

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

  const { accessToken: nextAccessToken } = await applicationContext()
    .get('CreateSessionTokenUseCase')
    .create({
      email: session.email,
      provider: session.provider,
      role: session.role,
      userId: session.userId,
    });

  const getCookieOptionsUseCase = applicationContext().get('GetCookieOptionsUseCase');

  response.cookies.set(
    accessTokenCookieName,
    nextAccessToken,
    getCookieOptionsUseCase.getCookieOptions(accessTokenMaxAgeSeconds),
  );

  return response;
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/') {
    if (await getValidAccessPayload(request)) {
      return getAuthenticatedHomeRedirect(request);
    }

    const response = await issueAccessTokenFromRefreshToken(
      request,
      getAuthenticatedHomeRedirect(request),
    );

    return response ?? NextResponse.next();
  }

  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (await getValidAccessPayload(request)) {
    return NextResponse.next();
  }

  const response = await issueAccessTokenFromRefreshToken(request, NextResponse.next());

  return response ?? getHomeRedirectWithNext(request);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
