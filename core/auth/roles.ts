import type { UserRole } from '@/lib/db/schema';

export const roleLabels: Record<UserRole, string> = {
  admin: '관리자',
  associate: '준회원',
  member: '정회원',
};

export const mutableRoles = ['associate', 'member', 'admin'] as const satisfies readonly UserRole[];

export function canManageMembers(role: UserRole) {
  return role === 'admin' || role === 'member';
}

export function canChangeRole(actorRole: UserRole, targetRole: UserRole, nextRole: UserRole) {
  if (actorRole === 'admin') {
    return true;
  }

  if (actorRole !== 'member') {
    return false;
  }

  return targetRole !== 'admin' && nextRole !== 'admin';
}
