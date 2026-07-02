import { Autowired } from '@/core/config/Autowired';
import type { UpdateProfileUseCase } from './port/in/UpdateProfileUseCase';
import type { ProfileCommandPort } from './port/out/ProfileCommandPort';
import type { ProfileImageStoragePort } from './port/out/ProfileImageStoragePort';
import type { ProfileQueryPort } from './port/out/ProfileQueryPort';

export class UpdateProfileService implements UpdateProfileUseCase {
  constructor(
    @Autowired('ProfileQueryPort')
    private profileQueryPort: ProfileQueryPort,
    @Autowired('ProfileCommandPort')
    private profileCommandPort: ProfileCommandPort,
    @Autowired('ProfileImageStoragePort')
    private profileImageStoragePort: ProfileImageStoragePort,
  ) {}

  async update(input: Parameters<UpdateProfileUseCase['update']>[0]) {
    const emailExists = await this.profileQueryPort.existsActiveUserByEmailExceptUserId({
      email: input.email,
      userId: input.userId,
    });

    if (emailExists) {
      throw new Error('이미 사용 중인 이메일입니다.');
    }

    const profileImageUrl = input.profileImageUpload
      ? await this.profileImageStoragePort.upload({
          ...input.profileImageUpload,
          userId: input.userId,
        })
      : input.removeProfileImage
        ? null
        : undefined;

    await this.profileCommandPort.updateActiveProfile({
      displayName: input.displayName,
      email: input.email,
      now: input.now,
      profileImageUrl,
      userId: input.userId,
    });
  }
}
