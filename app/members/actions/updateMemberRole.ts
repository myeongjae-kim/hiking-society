'use server';

import { requireRole } from '@/app/auth/actions/session';
import { mutableRoles, type UserRole } from '@/core/auth/model/roles';
import { applicationContext } from '@/core/config/applicationContext';
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

  await applicationContext().get('UpdateMemberRoleUseCase').update({
    actorRole: actor.role,
    nextRole,
    now: new Date(),
    userId,
  });

  revalidatePath('/members');
}
