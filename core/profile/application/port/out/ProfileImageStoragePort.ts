import type { ProfileImageUpload } from '../in/UpdateProfileUseCase';

export interface ProfileImageStoragePort {
  upload(input: ProfileImageUpload & { userId: number }): Promise<string>;
}
