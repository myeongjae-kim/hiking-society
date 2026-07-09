import { db } from '@/core/config/drizzle.server';
import { socialAccountTable, userTable } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { AuthQueryPort } from '../application/port/out/AuthQueryPort';
import { AuthenticatedUser } from '../model/AuthenticatedUser';
import { SessionSnapshot } from '../model/SessionSnapshot';

export class AuthQueryAdapter implements AuthQueryPort {
  async getSessionSnapshotByUserId(userId: number): Promise<SessionSnapshot | null> {
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

    return {
      email: row.email,
      provider: row.provider,
      role: row.role,
      userId: row.userId,
    };
  }

  async getUserByUserId(userId: number): Promise<AuthenticatedUser | null> {
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

    return {
      displayName: row.displayName,
      email: row.email,
      id: row.id,
      lastLoginAt: row.lastLoginAt,
      name: row.name,
      profileImageUrl: row.profileImageUrl,
      provider: row.provider,
      role: row.role,
    };
  }
}
