export type ProfileImageUploadTargetRequest = {
	readonly byteSize: number;
	readonly contentType: string;
	readonly fileName: string;
};

export type ProfileImageUploadTarget = {
	readonly objectKey: string;
	readonly uploadUrl: string;
	readonly url: string;
};

export interface ProfileImageUploadUseCase {
	createUploadTarget(
		input: ProfileImageUploadTargetRequest & { readonly userId: number },
	): Promise<ProfileImageUploadTarget>;
	deleteUploads(input: {
		readonly objectKeys: readonly string[];
		readonly userId: number;
	}): Promise<void>;
}
