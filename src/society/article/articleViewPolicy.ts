export const ARTICLE_MEDIA_REQUIRED_VIEW_MESSAGE =
	"글은 사진이나 동영상 없이 저장할 수 없습니다.";

export function hasPublishableArticleMedia(media: readonly unknown[]) {
	return media.length > 0;
}
