export const ARTICLE_MEDIA_REQUIRED_MESSAGE =
	"글은 사진이나 동영상 없이 저장할 수 없습니다.";

export class ArticleMediaCollection<TMedia = unknown> {
	private constructor(private readonly media: readonly TMedia[]) {}

	static from<TMedia>(media: readonly TMedia[]) {
		return new ArticleMediaCollection(media);
	}

	get count() {
		return this.media.length;
	}

	isPublishable() {
		return this.count > 0;
	}

	sortByOrder<TOrderedMedia extends { readonly order: number }>(
		this: ArticleMediaCollection<TOrderedMedia>,
	) {
		return [...this.media].toSorted((left, right) => left.order - right.order);
	}
}

export class ArticleOwnership {
	private constructor(private readonly authorUserId: number) {}

	static of(article: { readonly authorUserId: number }) {
		return new ArticleOwnership(article.authorUserId);
	}

	canBeManagedBy(userId: number) {
		return this.authorUserId === userId;
	}
}
