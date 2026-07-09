export const ARTICLE_MEDIA_REQUIRED_MESSAGE =
	"글은 사진이나 동영상 없이 저장할 수 없습니다.";

export class ArticleMediaRequirement {
	private constructor(private readonly mediaCount: number) {}

	static from(media: readonly unknown[]) {
		return new ArticleMediaRequirement(media.length);
	}

	isSatisfied() {
		return this.mediaCount > 0;
	}
}

export function canManageArticle(input: {
	authorUserId: number;
	userId: number;
}) {
	return input.authorUserId === input.userId;
}
