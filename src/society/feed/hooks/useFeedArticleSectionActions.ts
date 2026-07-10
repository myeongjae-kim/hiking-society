"use client";

import { $api } from "#/api/client/$api";
import { apiQueryKeys } from "#/api/client/queryKeys";
import type { ArticleViewId as ArticleId, ArticleViewModel as Article } from "#/society/shared/viewModels";
import type { HikingViewId as HikingId } from "#/society/shared/viewModels";

import type { FeedActionDeps } from "./feedActionTypes";

type UseFeedArticleSectionActionsInput = FeedActionDeps & {
	setActiveArticleForm: (
		form:
			| { articleId: ArticleId; type: "edit" }
			| { hikingId: HikingId; type: "create" },
	) => void;
};

export function useFeedArticleSectionActions({
	invalidateQueryKeys,
	refreshRoute,
	runner,
	setActiveArticleForm,
	setConfirmState,
}: UseFeedArticleSectionActionsInput) {
	const deleteArticleMutation = $api.useMutation(
		"delete",
		"/api/articles/{articleId}",
	);

	const requestDeleteArticle = (article: Article) => {
		setConfirmState({
			body: "정말 삭제할까요?",
			confirmLabel: "삭제",
			onConfirm: () => {
				runner.runMutation(
					{
						errorKey: `article-${article.id}`,
					},
					async () => {
						await deleteArticleMutation.mutateAsync({
							params: { path: { articleId: article.id } },
						});
						setConfirmState(null);
						invalidateQueryKeys([
							apiQueryKeys.articleDetail(article.id),
							apiQueryKeys.feed(),
							apiQueryKeys.hikingArticles(article.hikingId),
						]);
						refreshRoute();
					},
				);
			},
			title: "글 삭제",
		});
	};

	return {
		requestDeleteArticle,
		setActiveArticleForm,
	};
}
