import { Autowired } from '@/core/config/Autowired';
import { applicationError } from '@/core/common/application/ApplicationError';
import type { HikingCommandUseCase } from './port/in/HikingCommandUseCase';
import type { HikingCommandPort } from './port/out/HikingCommandPort';

export class HikingCommandService implements HikingCommandUseCase {
  constructor(
    @Autowired('HikingCommandPort')
    private hikingCommandPort: HikingCommandPort,
  ) {}

  async create(input: Parameters<HikingCommandUseCase['create']>[0]) {
    await this.hikingCommandPort.create(input);
  }

  async update(input: Parameters<HikingCommandUseCase['update']>[0]) {
    const hiking = await this.hikingCommandPort.findActiveHikingById(input.hikingId);

    if (!hiking || hiking.authorUserId !== input.userId) {
      throw applicationError.notFound('산행을 수정할 권한이 없거나 산행을 찾을 수 없습니다.');
    }

    const updated = await this.hikingCommandPort.update({
      hikingId: input.hikingId,
      now: new Date(),
      values: input.values,
    });

    if (!updated) {
      throw applicationError.notFound('산행을 수정할 권한이 없거나 산행을 찾을 수 없습니다.');
    }
  }

  async delete(input: Parameters<HikingCommandUseCase['delete']>[0]) {
    const hiking = await this.hikingCommandPort.findActiveHikingById(input.hikingId);

    if (!hiking || hiking.authorUserId !== input.userId) {
      throw applicationError.notFound('산행을 삭제할 권한이 없거나 산행을 찾을 수 없습니다.');
    }

    if (hiking.activeArticleCount > 0) {
      throw applicationError.badRequest('글이 있는 산행은 삭제할 수 없습니다.');
    }

    const deleted = await this.hikingCommandPort.delete({
      hikingId: input.hikingId,
      now: new Date(),
    });

    if (!deleted) {
      throw applicationError.notFound('산행을 삭제할 권한이 없거나 산행을 찾을 수 없습니다.');
    }
  }
}
