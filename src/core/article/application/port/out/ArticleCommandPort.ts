import type { ArticleId } from "@/core/article/domain";
import type {
	ExistingArticleMediaInput,
	StoredArticleMedia,
} from "@/core/article/model/ArticleMediaCommand";
import type { HikingId } from "@/core/hiking/domain";

export type ActiveArticleCommandSnapshot = {
	readonly authorUserId: number;
	readonly body: string;
	readonly hikingId: HikingId;
	readonly id: ArticleId;
};

export interface ArticleCommandPort {
	create(input: {
		authorUserId: number;
		body: string;
		hikingId: HikingId;
		storedMedia: readonly StoredArticleMedia[];
	}): Promise<ArticleId>;
	delete(input: { articleId: ArticleId; now: Date }): Promise<boolean>;
	findActiveArticleById(
		articleId: ArticleId,
	): Promise<ActiveArticleCommandSnapshot | null>;
	hasActiveHiking(hikingId: HikingId): Promise<boolean>;
	listActiveNotificationRecipientIds(input: {
		excludeUserId: number;
	}): Promise<readonly number[]>;
	update(input: {
		articleId: ArticleId;
		storedMedia: readonly (StoredArticleMedia | ExistingArticleMediaInput)[];
		values: { body: string };
		now: Date;
	}): Promise<boolean>;
}
