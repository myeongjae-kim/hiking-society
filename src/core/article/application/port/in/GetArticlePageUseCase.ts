import type { ArticleId } from "@/core/article/domain";
import type { ArticlePageResult } from "@/core/article/model/ArticlePage";
import type { AuthenticatedUser } from "@/core/auth/model/AuthenticatedUser";

export interface GetArticlePageUseCase {
	get(input: {
		readonly articleId: ArticleId;
		readonly currentUser: AuthenticatedUser;
		readonly includeNotifications?: boolean;
	}): Promise<ArticlePageResult>;
}
