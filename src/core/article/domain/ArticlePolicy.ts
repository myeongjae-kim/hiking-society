export const ARTICLE_MEDIA_REQUIRED_MESSAGE =
	"글은 사진이나 동영상 없이 저장할 수 없습니다.";

type UploadedArticleMediaOwnershipTarget = {
	readonly objectKey: string;
	readonly thumbnailUrl?: string | null;
	readonly url: string;
};

type UploadOwnershipChecker = {
	hasExpectedPublicUrl(input: {
		readonly objectKey: string;
		readonly url: string;
	}): boolean;
	hasOwnedObjectKey(objectKey: string): boolean;
	hasOwnedPublicUrl(url: string): boolean;
};

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

	toPublishable() {
		return PublishableArticleMedia.from(this.media);
	}

	sortByOrder<TOrderedMedia extends { readonly order: number }>(
		this: ArticleMediaCollection<TOrderedMedia>,
	) {
		return [...this.media].toSorted((left, right) => left.order - right.order);
	}
}

export class PublishableArticleMedia<TMedia = unknown> {
	private constructor(private readonly media: readonly TMedia[]) {}

	static from<TMedia>(media: readonly TMedia[]) {
		if (media.length === 0) {
			return null;
		}

		return new PublishableArticleMedia(media);
	}

	get count() {
		return this.media.length;
	}

	sortByOrder<TOrderedMedia extends { readonly order: number }>(
		this: PublishableArticleMedia<TOrderedMedia>,
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

export class UploadedArticleMediaOwnership {
	private constructor(
		private readonly input: {
			readonly media: readonly UploadedArticleMediaOwnershipTarget[];
			readonly ownershipPolicy: UploadOwnershipChecker;
		},
	) {}

	static of(input: {
		readonly media: readonly UploadedArticleMediaOwnershipTarget[];
		readonly ownershipPolicy: UploadOwnershipChecker;
	}) {
		return new UploadedArticleMediaOwnership(input);
	}

	findViolation() {
		for (const item of this.input.media) {
			if (
				!this.input.ownershipPolicy.hasOwnedObjectKey(item.objectKey) ||
				!this.input.ownershipPolicy.hasExpectedPublicUrl({
					objectKey: item.objectKey,
					url: item.url,
				})
			) {
				return "uploaded-media" as const;
			}

			if (
				item.thumbnailUrl &&
				!this.input.ownershipPolicy.hasOwnedPublicUrl(item.thumbnailUrl)
			) {
				return "thumbnail-url" as const;
			}
		}

		return null;
	}
}
