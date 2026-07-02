'use server';

import { AuthenticatedUser } from '@/core/auth/model/AuthenticatedUser';
import { applicationContext } from '@/core/config/applicationContext';
import { type UserRole } from '@/lib/db/schema';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const {
  accessTokenCookieName,
  accessTokenMaxAgeSeconds,
  refreshTokenCookieName,
  refreshTokenMaxAgeSeconds,
} = applicationContext().get('CookieConfig');

export async function setSessionCookies(input: {
  email: string;
  provider: string;
  role: UserRole;
  userId: number;
}) {
  const { accessToken, refreshToken } = await applicationContext()
    .get('CreateSessionTokenUseCase')
    .create(input);
  const cookieStore = await cookies();

  const getCookieOptionsUseCase = applicationContext().get('GetCookieOptionsUseCase');

  cookieStore.set(
    accessTokenCookieName,
    accessToken,
    getCookieOptionsUseCase.getCookieOptions(accessTokenMaxAgeSeconds),
  );
  cookieStore.set(
    refreshTokenCookieName,
    refreshToken,
    getCookieOptionsUseCase.getCookieOptions(refreshTokenMaxAgeSeconds),
  );
}

export async function clearSessionCookies() {
  const cookieStore = await cookies();

  cookieStore.delete(accessTokenCookieName);
  cookieStore.delete(refreshTokenCookieName);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(accessTokenCookieName)?.value;
  const refreshToken = cookieStore.get(refreshTokenCookieName)?.value;
  const accessPayload = accessToken
    ? await applicationContext().get('VerifyAccessTokenUseCase').verifyAccessToken(accessToken)
    : null;
  const refreshPayload = refreshToken
    ? await applicationContext().get('VerifyRefreshTokenUseCase').verifyRefreshToken(refreshToken)
    : null;
  const userId = accessPayload?.userId ?? refreshPayload?.userId;

  if (!userId) {
    return null;
  }

  const user = await applicationContext().get('AuthQueryPort').getUserByUserId(userId);

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

  return user satisfies AuthenticatedUser;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  return user;
}

export async function requireRole(allowedRoles: readonly UserRole[]) {
  const user = await requireCurrentUser();

  if (!allowedRoles.includes(user.role)) {
    redirect('/feed');
  }

  return user;
}
