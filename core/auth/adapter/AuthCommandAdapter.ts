import { db } from '@/lib/db/drizzle';
import { socialAccountTable, userTable } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import type { AuthCommandPort } from '../application/port/out/AuthCommandPort';
import type { GoogleAccountPayload } from '../model/GoogleAccountPayload';

export class AuthCommandAdapter implements AuthCommandPort {
  async upsertGoogleAccount(input: { now: Date; payload: GoogleAccountPayload }) {
    const { now, payload } = input;

    const user = await db.transaction(async (tx) => {
      const [existingAccount] = await tx
        .select({
          user: userTable,
        })
        .from(socialAccountTable)
        .innerJoin(userTable, eq(userTable.id, socialAccountTable.userId))
        .where(
          and(
            eq(socialAccountTable.provider, payload.provider),
            eq(socialAccountTable.providerUserId, payload.providerUserId),
            isNull(socialAccountTable.deletedAt),
            isNull(userTable.deletedAt),
          ),
        )
        .limit(1);

      if (existingAccount) {
        const [updatedUser] = await tx
          .update(userTable)
          .set({
            displayName: payload.displayName,
            email: payload.email,
            lastLoginAt: now,
            name: payload.displayName,
            profileImageUrl: payload.profileImageUrl,
            updatedAt: now,
          })
          .where(eq(userTable.id, existingAccount.user.id))
          .returning();

        await tx
          .update(socialAccountTable)
          .set({
            displayName: payload.displayName,
            email: payload.email,
            emailVerified: payload.emailVerified,
            profileImageUrl: payload.profileImageUrl,
            rawClaims: payload.rawClaims,
            updatedAt: now,
          })
          .where(
            and(
              eq(socialAccountTable.provider, payload.provider),
              eq(socialAccountTable.providerUserId, payload.providerUserId),
            ),
          );

        return updatedUser;
      }

      const [existingUserByEmail] = await tx
        .select()
        .from(userTable)
        .where(and(eq(userTable.email, payload.email), isNull(userTable.deletedAt)))
        .limit(1);

      const userForSocialAccount =
        existingUserByEmail ??
        (
          await tx
            .insert(userTable)
            .values({
              displayName: payload.displayName,
              email: payload.email,
              lastLoginAt: now,
              name: payload.displayName,
              profileImageUrl: payload.profileImageUrl,
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
            displayName: payload.displayName,
            lastLoginAt: now,
            name: payload.displayName,
            profileImageUrl: payload.profileImageUrl,
            updatedAt: now,
          })
          .where(eq(userTable.id, existingUserByEmail.id));
      }

      await tx.insert(socialAccountTable).values({
        displayName: payload.displayName,
        email: payload.email,
        emailVerified: payload.emailVerified,
        profileImageUrl: payload.profileImageUrl,
        provider: payload.provider,
        providerUserId: payload.providerUserId,
        rawClaims: payload.rawClaims,
        userId: userForSocialAccount.id,
      });

      return userForSocialAccount;
    });

    return {
      email: user.email ?? payload.email,
      id: user.id,
      role: user.role,
    };
  }
}
