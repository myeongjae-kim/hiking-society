import type { ArticleId } from "@/core/article/domain";
import type { ArticleDetailSnapshot } from "@/core/article/model/ArticleDetailSnapshot";

export interface ArticleDetailQueryPort {
	get(input: {
		articleId: ArticleId;
		currentUserId: number;
	}): Promise<ArticleDetailSnapshot | null>;
}
