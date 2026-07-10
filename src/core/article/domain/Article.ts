import type {
	AuthorName,
	Brand,
	IsoDateTimeString,
} from "@/core/common/domain";
import type { HikingId } from "@/core/hiking/domain";
import type { PublishableArticleMedia } from "./ArticlePolicy";

export type ArticleId = Brand<string, "ArticleId">;
export const ARTICLE_BODY_REQUIRED_MESSAGE = "글 내용을 입력해주세요.";

export type ArticleMediaType = "image" | "video";

export type ArticleMediaMetadataSummary = {
	readonly dateTime?: string | null;
	readonly exposureTime?: string | null;
	readonly fNumber?: string | null;
	readonly focalLengthIn35mmFilm?: string | null;
	readonly isoSpeedRatings?: string | null;
	readonly make?: string | null;
	readonly model?: string | null;
	readonly shutterSpeedValue?: string | null;
};

export type ArticleMedia = {
	readonly byteSize?: number;
	readonly contentType?: string;
	readonly durationMs?: number | null;
	readonly height?: number | null;
	readonly mediaType: ArticleMediaType;
	readonly metadata?: ArticleMediaMetadataSummary | null;
	readonly objectKey?: string;
	readonly thumbnailUrl?: string | null;
	readonly url: string;
	readonly order: number;
	readonly width?: number | null;
};

export type ArticleMediaItems = readonly [ArticleMedia, ...ArticleMedia[]];

export type Article = {
	readonly id: ArticleId;
	readonly authorUserId?: number;
	readonly hikingId: HikingId;
	readonly media: ArticleMediaItems;
	readonly body: string;
	readonly authorName: AuthorName;
	readonly authorProfileImageUrl: string | null;
	readonly likeCount: number;
	readonly likedByCurrentUser: boolean;
	readonly createdAt: IsoDateTimeString;
	readonly updatedAt: IsoDateTimeString;
	readonly deletedAt: IsoDateTimeString | null;
	readonly edited: boolean;
};

export type CreateArticleInput = {
	readonly authorUserId: number;
	readonly hikingId: HikingId;
	readonly media: ArticleMediaItems;
	readonly body: string;
};

export type UpdateArticleInput = {
	readonly media?: ArticleMediaItems;
	readonly body?: string;
};

export type ArticleEntitySnapshot = {
	readonly body: string;
	readonly hikingId: HikingId;
	readonly id: ArticleId;
	readonly authorUserId: number;
};

export class ArticleBody {
	private constructor(private readonly value: string) {}

	static from(value: string) {
		const normalized = value.trim();

		if (normalized.length === 0) {
			return null;
		}

		return new ArticleBody(normalized);
	}

	toString() {
		return this.value;
	}
}

export class ArticleDraft<TMedia extends { readonly order: number }> {
	private constructor(
		private readonly input: {
			readonly authorUserId: number;
			readonly body: ArticleBody;
			readonly hikingId: HikingId;
			readonly media: PublishableArticleMedia<TMedia>;
		},
	) {}

	static create<TMedia extends { readonly order: number }>(input: {
		readonly authorUserId: number;
		readonly body: ArticleBody;
		readonly hikingId: HikingId;
		readonly media: PublishableArticleMedia<TMedia>;
	}) {
		return new ArticleDraft(input);
	}

	get authorUserId() {
		return this.input.authorUserId;
	}

	get body() {
		return this.input.body.toString();
	}

	get hikingId() {
		return this.input.hikingId;
	}

	toCreateCommand() {
		return {
			authorUserId: this.input.authorUserId,
			body: this.input.body.toString(),
			hikingId: this.input.hikingId,
			storedMedia: this.input.media.sortByOrder(),
		};
	}

	toArticleCreatedNotification(articleId: ArticleId) {
		return {
			actorUserId: this.input.authorUserId,
			articleBody: this.input.body.toString(),
			articleId,
		};
	}
}

export class ArticleEntity {
	private constructor(private readonly snapshot: ArticleEntitySnapshot) {}

	static rehydrate(snapshot: ArticleEntitySnapshot) {
		return new ArticleEntity(snapshot);
	}

	canBeManagedBy(userId: number) {
		return this.snapshot.authorUserId === userId;
	}

	planUpdate<TMedia extends { readonly order: number }>(input: {
		readonly body: ArticleBody;
		readonly media: PublishableArticleMedia<TMedia>;
		readonly userId: number;
	}) {
		if (!this.canBeManagedBy(input.userId)) {
			return null;
		}

		return {
			articleId: this.snapshot.id,
			body: input.body.toString(),
			storedMedia: input.media.sortByOrder(),
		};
	}

	planDelete(input: { readonly userId: number }) {
		if (!this.canBeManagedBy(input.userId)) {
			return null;
		}

		return {
			articleId: this.snapshot.id,
		};
	}
}
