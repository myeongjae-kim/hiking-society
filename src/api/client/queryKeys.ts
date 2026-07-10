import type { ArticleViewId as ArticleId } from "#/society/shared/viewModels";
import type { HikingViewId as HikingId } from "#/society/shared/viewModels";

import { $api } from "./$api";

export const apiQueryKeys = {
	articleComments: (articleId: ArticleId) =>
		$api.queryOptions("get", "/api/articles/{articleId}/comments", {
			params: { path: { articleId } },
		}).queryKey,
	articleDetail: (articleId: ArticleId) =>
		$api.queryOptions("get", "/api/articles/{articleId}", {
			params: { path: { articleId } },
		}).queryKey,
	feed: () => $api.queryOptions("get", "/api/feed").queryKey,
	geocodingSearch: (query: string) =>
		$api.queryOptions("get", "/api/geocoding/search", {
			params: { query: { q: query } },
		}).queryKey,
	hikingArticles: (hikingId: HikingId) =>
		$api.queryOptions("get", "/api/feed/hikings/{hikingId}/articles", {
			params: { path: { hikingId } },
		}).queryKey,
	members: () => $api.queryOptions("get", "/api/members").queryKey,
	notifications: (input?: { limit?: number; offset?: number | null }) =>
		input
			? $api.queryOptions("get", "/api/notifications", {
					params: { query: input },
				}).queryKey
			: $api.queryOptions("get", "/api/notifications").queryKey,
} as const;
