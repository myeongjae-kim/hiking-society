export type UserRole = 'admin' | 'member' | 'associate';

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
