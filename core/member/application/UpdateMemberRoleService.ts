import { canChangeRole } from '@/core/auth/model/roles';
import { Autowired } from '@/core/config/Autowired';
import type { UpdateMemberRoleUseCase } from './port/in/UpdateMemberRoleUseCase';
import type { MemberCommandPort } from './port/out/MemberCommandPort';
import type { MemberQueryPort } from './port/out/MemberQueryPort';

export class UpdateMemberRoleService implements UpdateMemberRoleUseCase {
  constructor(
    @Autowired('MemberQueryPort')
    private memberQueryPort: MemberQueryPort,
    @Autowired('MemberCommandPort')
    private memberCommandPort: MemberCommandPort,
  ) {}

  async update(input: Parameters<UpdateMemberRoleUseCase['update']>[0]) {
    const targetRole = await this.memberQueryPort.findActiveMemberRoleById(input.userId);

    if (!targetRole) {
      throw new Error('Member not found.');
    }

    if (!canChangeRole(input.actorRole, targetRole, input.nextRole)) {
      throw new Error('You cannot change this member role.');
    }

    await this.memberCommandPort.updateActiveMemberRole({
      nextRole: input.nextRole,
      now: input.now,
      userId: input.userId,
    });
  }
}
