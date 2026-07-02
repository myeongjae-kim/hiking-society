import { NextResponse, type NextRequest } from 'next/server';
import { applicationContext } from './core/config/applicationContext';

const { accessTokenCookieName, accessTokenMaxAgeSeconds, refreshTokenCookieName } =
  applicationContext().get('CookieConfig');

const protectedPathPrefixes = ['/feed', '/me', '/members'];

function isProtectedPath(pathname: string) {
  return protectedPathPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

async function getValidAccessPayload(request: NextRequest) {
  const accessToken = request.cookies.get(accessTokenCookieName)?.value;

  if (!accessToken) {
    return null;
  }

  return applicationContext().get('VerifyAccessTokenUseCase').verifyAccessToken(accessToken);
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/' && (await getValidAccessPayload(request))) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get(refreshTokenCookieName)?.value;

  if (await getValidAccessPayload(request)) {
    return NextResponse.next();
  }

  const refreshPayload = refreshToken
    ? await applicationContext().get('VerifyRefreshTokenUseCase').verifyRefreshToken(refreshToken)
    : null;

  if (!refreshPayload) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const session = await applicationContext()
    .get('AuthQueryPort')
    .getSessionSnapshotByUserId(refreshPayload.userId);

  if (!session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const response = NextResponse.next();

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

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
