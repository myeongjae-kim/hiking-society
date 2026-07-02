import { db } from '@/lib/db/drizzle';
import { socialAccountTable, userTable, type User, type UserRole } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  accessTokenCookieName,
  accessTokenMaxAgeSeconds,
  createSessionTokens,
  getCookieOptions,
  refreshTokenCookieName,
  refreshTokenMaxAgeSeconds,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt';

export type AuthenticatedUser = Pick<
  User,
  'displayName' | 'email' | 'id' | 'lastLoginAt' | 'name' | 'profileImageUrl' | 'role'
> & {
  provider: string | null;
};

export async function setSessionCookies(input: {
  email: string;
  provider: string;
  role: UserRole;
  userId: number;
}) {
  const { accessToken, refreshToken } = await createSessionTokens(input);
  const cookieStore = await cookies();

  cookieStore.set(accessTokenCookieName, accessToken, getCookieOptions(accessTokenMaxAgeSeconds));
  cookieStore.set(
    refreshTokenCookieName,
    refreshToken,
    getCookieOptions(refreshTokenMaxAgeSeconds),
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
  const accessPayload = accessToken ? await verifyAccessToken(accessToken) : null;
  const refreshPayload = refreshToken ? await verifyRefreshToken(refreshToken) : null;
  const userId = accessPayload?.userId ?? refreshPayload?.userId;

  if (!userId) {
    return null;
  }

  const [row] = await db
    .select({
      displayName: userTable.displayName,
      email: userTable.email,
      id: userTable.id,
      lastLoginAt: userTable.lastLoginAt,
      name: userTable.name,
      profileImageUrl: userTable.profileImageUrl,
      provider: socialAccountTable.provider,
      role: userTable.role,
    })
    .from(userTable)
    .leftJoin(
      socialAccountTable,
      and(eq(socialAccountTable.userId, userTable.id), isNull(socialAccountTable.deletedAt)),
    )
    .where(and(eq(userTable.id, userId), isNull(userTable.deletedAt)))
    .limit(1);

  if (!row || !row.email) {
    return null;
  }

  if (!accessPayload && refreshPayload && row.provider) {
    await setSessionCookies({
      email: row.email,
      provider: row.provider,
      role: row.role,
      userId: row.id,
    });
  }

  return row satisfies AuthenticatedUser;
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
