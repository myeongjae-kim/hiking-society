import type { UserRole } from '@/core/auth/model/roles';

export interface MemberCommandPort {
  updateActiveMemberRole(input: { nextRole: UserRole; now: Date; userId: number }): Promise<void>;
}
