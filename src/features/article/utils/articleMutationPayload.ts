import type { ArticleFormValues } from "#/features/article/components/articleFormTypes";
import type { UploadedArticleMedia } from "#/features/article/utils/article-media-upload";
import type { ArticleId } from "@/core/article/domain";
import type { HikingId } from "@/core/hiking/domain";

export type ExistingArticleMutationMedia = {
	byteSize?: number;
	contentType?: string;
	durationMs?: number | null;
	height?: number | null;
	mediaType: "image" | "video";
	metadata?: Record<string, string | null | undefined> | null;
	objectKey?: string;
	order: number;
	thumbnailUrl?: string | null;
	url: string;
	width?: number | null;
};

export type ArticleMutationIdentifiers = {
	articleId?: ArticleId;
	hikingId?: HikingId;
};

export type ArticleMutationPayload = ArticleMutationIdentifiers & {
	body: string;
	existingMedia: ExistingArticleMutationMedia[];
	uploadedMedia: UploadedArticleMedia[];
};

export function getExistingArticleMediaPayload(
	values: ArticleFormValues,
): ExistingArticleMutationMedia[] {
	return values.media
		.filter((media) => !media.file)
		.map((media) => ({
			byteSize: media.byteSize,
			contentType: media.contentType,
			durationMs: media.durationMs,
			height: media.height,
			mediaType: media.mediaType,
			metadata: media.metadata,
			objectKey: media.objectKey,
			order: media.order,
			thumbnailUrl: media.thumbnailUrl,
			url: media.url,
			width: media.width,
		}));
}

export function createArticleMutationPayload(
	values: ArticleFormValues,
	uploadedMedia: UploadedArticleMedia[],
	identifiers: ArticleMutationIdentifiers = {},
): ArticleMutationPayload {
	return {
		body: values.body,
		existingMedia: getExistingArticleMediaPayload(values),
		uploadedMedia,
		...identifiers,
	};
}
