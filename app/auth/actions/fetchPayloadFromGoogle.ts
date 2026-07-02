'use server';

import { setSessionCookies } from '@/app/auth/actions/session';
import { env } from '@/core/config/env';
import { db } from '@/lib/db/drizzle';
import { socialAccountTable, userTable, type User } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
  env.NEXT_PUBLIC_GOOGLE_LOGIN_CLIENT_ID,
  env.GOOGLE_LOGIN_CLIENT_SECRET,
  'postmessage',
);

type GoogleLoginResult = {
  ok: true;
  user: {
    email: string;
    id: number;
    role: User['role'];
  };
};

function getDisplayName(payload: { email?: string; name?: string }) {
  return payload.name ?? payload.email ?? 'Google user';
}

function toRawClaims(payload: object) {
  return JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
}

export const loginWithGoogleCode = async (code: string): Promise<GoogleLoginResult> => {
  const { tokens } = await client.getToken(code);

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: env.NEXT_PUBLIC_GOOGLE_LOGIN_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email) {
    throw new Error('Google account payload is missing required identity fields.');
  }

  const email = payload.email;
  const now = new Date();
  const provider = 'google';
  const providerUserId = payload.sub;
  const displayName = getDisplayName(payload);
  const emailVerified = payload.email_verified ?? false;
  const profileImageUrl = payload.picture ?? null;
  const rawClaims = toRawClaims(payload);

  const user = await db.transaction(async (tx) => {
    const [existingAccount] = await tx
      .select({
        user: userTable,
      })
      .from(socialAccountTable)
      .innerJoin(userTable, eq(userTable.id, socialAccountTable.userId))
      .where(
        and(
          eq(socialAccountTable.provider, provider),
          eq(socialAccountTable.providerUserId, providerUserId),
          isNull(socialAccountTable.deletedAt),
          isNull(userTable.deletedAt),
        ),
      )
      .limit(1);

    if (existingAccount) {
      const [updatedUser] = await tx
        .update(userTable)
        .set({
          displayName,
          email,
          lastLoginAt: now,
          name: displayName,
          profileImageUrl,
          updatedAt: now,
        })
        .where(eq(userTable.id, existingAccount.user.id))
        .returning();

      await tx
        .update(socialAccountTable)
        .set({
          displayName,
          email,
          emailVerified,
          profileImageUrl,
          rawClaims,
          updatedAt: now,
        })
        .where(
          and(
            eq(socialAccountTable.provider, provider),
            eq(socialAccountTable.providerUserId, providerUserId),
          ),
        );

      return updatedUser;
    }

    const [existingUserByEmail] = await tx
      .select()
      .from(userTable)
      .where(and(eq(userTable.email, email), isNull(userTable.deletedAt)))
      .limit(1);

    const userForSocialAccount =
      existingUserByEmail ??
      (
        await tx
          .insert(userTable)
          .values({
            displayName,
            email,
            lastLoginAt: now,
            name: displayName,
            profileImageUrl,
          })
          .returning()
      )[0];

    if (!userForSocialAccount) {
      throw new Error('Failed to create user.');
    }

    if (existingUserByEmail) {
      await tx
        .update(userTable)
        .set({
          displayName,
          lastLoginAt: now,
          name: displayName,
          profileImageUrl,
          updatedAt: now,
        })
        .where(eq(userTable.id, existingUserByEmail.id));
    }

    await tx.insert(socialAccountTable).values({
      displayName,
      email,
      emailVerified,
      profileImageUrl,
      provider,
      providerUserId,
      rawClaims,
      userId: userForSocialAccount.id,
    });

    return userForSocialAccount;
  });

  await setSessionCookies({
    email,
    provider,
    role: user.role,
    userId: user.id,
  });

  return {
    ok: true,
    user: {
      email,
      id: user.id,
      role: user.role,
    },
  };
};
