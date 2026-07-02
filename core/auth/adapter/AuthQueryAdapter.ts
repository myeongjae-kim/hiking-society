import { db } from '@/lib/db/drizzle';
import { socialAccountTable, userTable } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { AuthQueryPort } from '../application/port/out/AuthQueryPort';
import { AuthenticatedUser } from '../model/AuthenticatedUser';

export class AuthQueryAdapter implements AuthQueryPort {
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

    return row;
  }
}
