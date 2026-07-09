import type { Article, ArticleId } from "@/core/article/domain";
import type { Comment, CommentId } from "@/core/comment/domain";
import type { HikingId } from "@/core/hiking/domain";

export function createHikingArticleCountById(
	hikingArticleCounts: readonly {
		articleCount: number;
		hikingId: HikingId;
	}[],
) {
	return new Map<HikingId, number>(
		hikingArticleCounts.map((item) => [item.hikingId, item.articleCount]),
	);
}

export function createArticleHikingIdByArticleId(articles: readonly Article[]) {
	return new Map<ArticleId, HikingId>(
		articles.map((article) => [article.id, article.hikingId]),
	);
}

export function createCommentArticleIdByCommentId(
	comments: readonly Comment[],
) {
	return new Map<CommentId, ArticleId>(
		comments.map((comment) => [comment.id, comment.articleId]),
	);
}

export function filterRecordByActiveHikingIds<T>(
	record: Record<string, T>,
	activeHikingIds: ReadonlySet<HikingId>,
) {
	return Object.fromEntries(
		Object.entries(record).filter(([hikingId]) =>
			activeHikingIds.has(hikingId as HikingId),
		),
	);
}
