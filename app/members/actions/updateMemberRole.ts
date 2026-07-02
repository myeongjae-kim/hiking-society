'use server';

import { canChangeRole, mutableRoles } from '@/core/auth/roles';
import { requireRole } from '@/core/auth/session';
import { db } from '@/lib/db/drizzle';
import { userTable, type UserRole } from '@/lib/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

function parseRole(value: FormDataEntryValue | null): UserRole {
  if (typeof value === 'string' && mutableRoles.includes(value as UserRole)) {
    return value as UserRole;
  }

  throw new Error('Invalid role.');
}

function parseUserId(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    throw new Error('Invalid user id.');
  }

  const userId = Number(value);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('Invalid user id.');
  }

  return userId;
}

export async function updateMemberRole(formData: FormData) {
  const actor = await requireRole(['admin', 'member']);
  const userId = parseUserId(formData.get('userId'));
  const nextRole = parseRole(formData.get('role'));

  const [targetUser] = await db
    .select()
    .from(userTable)
    .where(and(eq(userTable.id, userId), isNull(userTable.deletedAt)))
    .limit(1);

  if (!targetUser) {
    throw new Error('Member not found.');
  }

  if (!canChangeRole(actor.role, targetUser.role, nextRole)) {
    throw new Error('You cannot change this member role.');
  }

  await db
    .update(userTable)
    .set({
      role: nextRole,
      updatedAt: new Date(),
    })
    .where(eq(userTable.id, userId));

  revalidatePath('/members');
}
