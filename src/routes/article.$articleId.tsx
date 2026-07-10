import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { getArticleRouteData } from "#/society-app/article/articleRouteData.functions";
import ArticleDetailPageView from "#/society/article/ArticleDetailPageView";
import { getLoginRedirectHref } from "#/society/auth/session.shared";
import { AssociateFeedNotice } from "#/society/feed/components/AssociateFeedNotice";
import { toNumericSearchId } from "#/routing/searchParams";
import {
	toArticleDetailSnapshotViewModel,
	toAuthenticatedUserViewModel,
	toHikingViewModel,
	toNotificationListSnapshotViewModel,
} from "#/society/shared/coreViewModelMappers";
import type { CommentViewId as CommentId } from "#/society/shared/viewModels";

export const Route = createFileRoute("/article/$articleId")({
	component: ArticleDetailRoute,
	loader: async ({ location, params }) => {
		const data = await getArticleRouteData({
			data: { articleId: params.articleId },
		});

		if (data.status === "unauthenticated") {
			throw redirect({ href: getLoginRedirectHref(location.href) });
		}

		if (data.status === "notFound") {
			throw notFound();
		}

		if (data.status === "associate") {
			return {
				currentTheme: data.currentTheme,
				currentUser: toAuthenticatedUserViewModel(data.currentUser),
				status: "associate" as const,
			};
		}

		const articleSnapshot = toArticleDetailSnapshotViewModel({
			article: data.article,
			comments: data.comments,
		});

		return {
			article: articleSnapshot.article,
			comments: articleSnapshot.comments,
			currentTheme: data.currentTheme,
			currentUser: toAuthenticatedUserViewModel(data.currentUser),
			hiking: toHikingViewModel(data.hiking),
			notificationSnapshot: toNotificationListSnapshotViewModel(
				data.notificationSnapshot,
			),
			status: "ok" as const,
		};
	},
	validateSearch: (search) => ({
		commentId: toNumericSearchId<CommentId>(search.commentId),
	}),
});

function ArticleDetailRoute() {
	const data = Route.useLoaderData();
	const { commentId } = Route.useSearch();

	if (data.status === "associate") {
		return <AssociateFeedNotice user={data.currentUser} />;
	}

	const { status: _status, ...pageData } = data;

	return (
		<ArticleDetailPageView {...pageData} highlightedCommentId={commentId} />
	);
}
