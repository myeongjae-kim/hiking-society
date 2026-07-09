export type UploadedProfileImage = {
	readonly byteSize: number;
	readonly contentType: string;
	readonly objectKey: string;
	readonly url: string;
};

export type UpdateProfileInput = {
	readonly displayName: string;
	readonly email: string;
	readonly now: Date;
	readonly profileImage?: UploadedProfileImage;
	readonly removeProfileImage: boolean;
	readonly userId: number;
};

export interface UpdateProfileUseCase {
	update(input: UpdateProfileInput): Promise<void>;
}
