export type UploadedProfileImage = {
	readonly byteSize: number;
	readonly contentType: string;
	readonly objectKey: string;
	readonly url: string;
};

export interface UpdateProfileImageUseCase {
	updateProfileImage(input: {
		readonly profileImage?: UploadedProfileImage;
		readonly removeProfileImage: boolean;
		readonly userId: number;
	}): Promise<void>;
}
