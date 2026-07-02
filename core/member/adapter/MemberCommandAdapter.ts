import { db } from '@/lib/db/drizzle';
import { userTable } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import type { MemberCommandPort } from '../application/port/out/MemberCommandPort';

export class MemberCommandAdapter implements MemberCommandPort {
  async updateActiveMemberRole(input: Parameters<MemberCommandPort['updateActiveMemberRole']>[0]) {
    await db
      .update(userTable)
      .set({
        role: input.nextRole,
        updatedAt: input.now,
      })
      .where(and(eq(userTable.id, input.userId), isNull(userTable.deletedAt)));
  }
}
