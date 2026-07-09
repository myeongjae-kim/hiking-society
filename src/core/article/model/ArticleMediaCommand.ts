import type { ArticleMedia, ArticleMediaType } from "@/core/article/domain";

export type ArticleMediaUpload = {
	readonly byteSize: number;
	readonly contentType: string;
	readonly durationMs?: number | null;
	readonly height?: number | null;
	readonly mediaType: ArticleMediaType;
	readonly objectKey: string;
	readonly originalMetadata?: Record<string, unknown> | null;
	readonly order: number;
	readonly thumbnailUrl?: string | null;
	readonly url: string;
	readonly width?: number | null;
};

export type ExistingArticleMediaInput = ArticleMedia & {
	readonly objectKey?: string;
	readonly byteSize?: number;
	readonly contentType?: string;
};

export type StoredArticleMedia = ArticleMedia & {
	readonly byteSize: number;
	readonly contentType: string;
	readonly objectKey: string;
	readonly originalMetadata?: Record<string, unknown> | null;
};
