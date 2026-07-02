import type { UserRole } from '@/core/auth/model/roles';

export interface UpdateMemberRoleUseCase {
  update(input: {
    actorRole: UserRole;
    nextRole: UserRole;
    now: Date;
    userId: number;
  }): Promise<void>;
}
