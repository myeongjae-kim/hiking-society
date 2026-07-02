export type ProfileImageUpload = {
  readonly byteSize: number;
  readonly bytes: Uint8Array;
  readonly contentType: string;
  readonly fileName: string;
};

export type UpdateProfileInput = {
  readonly displayName: string;
  readonly email: string;
  readonly now: Date;
  readonly profileImageUpload?: ProfileImageUpload;
  readonly removeProfileImage: boolean;
  readonly userId: number;
};

export interface UpdateProfileUseCase {
  update(input: UpdateProfileInput): Promise<void>;
}
