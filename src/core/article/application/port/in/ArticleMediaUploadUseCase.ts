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

export interface ArticleMediaUploadUseCase {
	createUploadTargets(input: {
		readonly targets: readonly ArticleMediaUploadTargetRequest[];
		readonly userId: number;
	}): Promise<readonly ArticleMediaUploadTarget[]>;
	deleteUploads(input: {
		readonly objectKeys: readonly string[];
		readonly userId: number;
	}): Promise<void>;
}
