import { db } from '@/lib/db/drizzle';
import { socialAccountTable, userTable } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { NextResponse, type NextRequest } from 'next/server';
import {
  accessTokenCookieName,
  accessTokenMaxAgeSeconds,
  createSessionTokens,
  getCookieOptions,
  refreshTokenCookieName,
  verifyAccessToken,
  verifyRefreshToken,
} from './core/auth/jwt';

async function getSessionSnapshot(userId: number) {
  const [row] = await db
    .select({
      email: userTable.email,
      provider: socialAccountTable.provider,
      role: userTable.role,
      userId: userTable.id,
    })
    .from(userTable)
    .leftJoin(
      socialAccountTable,
      and(eq(socialAccountTable.userId, userTable.id), isNull(socialAccountTable.deletedAt)),
    )
    .where(and(eq(userTable.id, userId), isNull(userTable.deletedAt)))
    .limit(1);

  if (!row?.email || !row.provider) {
    return null;
  }

  return row;
}

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(accessTokenCookieName)?.value;
  const refreshToken = request.cookies.get(refreshTokenCookieName)?.value;

  if (accessToken && (await verifyAccessToken(accessToken))) {
    return NextResponse.next();
  }

  const refreshPayload = refreshToken ? await verifyRefreshToken(refreshToken) : null;

  if (!refreshPayload) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const session = await getSessionSnapshot(refreshPayload.userId);

  if (!session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const response = NextResponse.next();
  const email = session.email;
  const provider = session.provider;

  if (!email || !provider) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const { accessToken: nextAccessToken } = await createSessionTokens({
    email,
    provider,
    role: session.role,
    userId: session.userId,
  });

  response.cookies.set(
    accessTokenCookieName,
    nextAccessToken,
    getCookieOptions(accessTokenMaxAgeSeconds),
  );

  return response;
}

export const config = {
  matcher: [
    '/((?!$|api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
