import type { UserRole } from '@/core/auth/model/roles';

export type MemberListItem = {
  createdAt: Date;
  displayName: string | null;
  email: string | null;
  id: number;
  lastLoginAt: Date | null;
  name: string | null;
  provider: string | null;
  role: UserRole;
};
