import type { ArticleViewId as ArticleId } from "#/society/shared/viewModels";
import type { CommentViewId as CommentId } from "#/society/shared/viewModels";
import type { HikingViewId as HikingId } from "#/society/shared/viewModels";

export type ActiveArticleForm =
	| { hikingId: HikingId; type: "create" }
	| { articleId: ArticleId; type: "edit" }
	| null;

export type ActiveHikingForm =
	| { type: "create" }
	| { hikingId: HikingId; type: "edit" }
	| null;

export type HikingArticleLoadState =
	| { error?: undefined; status: "idle" | "loading" | "loaded" | "refreshing" }
	| { error: string; status: "error" };

export type LikePendingKey = `article-${ArticleId}` | `comment-${CommentId}`;

export const getCommentCreateSingleFlightKey = (
	articleId: ArticleId,
	parentCommentId: CommentId | null,
) => `comment-create-${articleId}-${parentCommentId ?? "root"}`;

export const getCommentUpdateSingleFlightKey = (commentId: CommentId) =>
	`comment-update-${commentId}`;

export function hasRecordKey<T>(record: Record<string, T>, key: string) {
	return Object.hasOwn(record, key);
}
