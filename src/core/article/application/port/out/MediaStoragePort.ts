import type { ArticleMediaType } from "@/core/article/domain";

export type ArticleMediaUploadTargetRequest = {
	readonly byteSize: number;
	readonly contentType: string;
	readonly fileName: string;
	readonly mediaType: ArticleMediaType;
	readonly thumbnail?: {
		readonly byteSize: number;
		readonly contentType: string;
		readonly fileName: string;
	};
};

export type ArticleMediaUploadTarget = {
	readonly objectKey: string;
	readonly uploadUrl: string;
	readonly url: string;
	readonly thumbnail?: {
		readonly objectKey: string;
		readonly uploadUrl: string;
		readonly url: string;
	};
};

export interface MediaStoragePort {
	createUploadTarget(
		input: ArticleMediaUploadTargetRequest & { now: Date; userId: number },
	): Promise<ArticleMediaUploadTarget>;
	deleteObjects(input: {
		objectKeys: readonly string[];
		userId: number;
	}): Promise<void>;
}
