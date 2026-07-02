import { NextResponse, type NextRequest } from 'next/server';
import { applicationContext } from './core/config/applicationContext';

const { accessTokenCookieName, accessTokenMaxAgeSeconds, refreshTokenCookieName } =
  applicationContext().get('CookieConfig');

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(accessTokenCookieName)?.value;
  const refreshToken = request.cookies.get(refreshTokenCookieName)?.value;

  if (
    accessToken &&
    (await applicationContext().get('VerifyAccessTokenUseCase').verifyAccessToken(accessToken))
  ) {
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
    '/((?!$|api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
