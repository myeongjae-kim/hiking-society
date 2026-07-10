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

export interface ProfileImageStoragePort {
	createUploadTarget(
		input: ProfileImageUploadTargetRequest & { now: Date; userId: number },
	): Promise<ProfileImageUploadTarget>;
	deleteObjects(input: {
		objectKeys: readonly string[];
		userId: number;
	}): Promise<void>;
}
