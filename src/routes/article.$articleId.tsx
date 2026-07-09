import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { getArticleRouteData } from "#/app-features/article/articleRouteData.functions";
import ArticleDetailPageView from "#/features/article/ArticleDetailPageView";
import { getLoginRedirectHref } from "#/features/auth/session.shared";
import type { CommentId } from "@/core/comment/domain";

function getSingleSearchParam(value: unknown) {
	return Array.isArray(value) ? value[0] : value;
}

function toCommentId(value: unknown) {
	const commentId = getSingleSearchParam(value);

	if (typeof commentId !== "string" || !/^\d+$/.test(commentId)) {
		return null;
	}

	return commentId as CommentId;
}

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
				article: null,
				comments: [],
				currentTheme: data.currentTheme,
				currentUser: data.currentUser,
				hiking: null,
				notificationSnapshot: null,
			};
		}

		return {
			article: data.article,
			comments: data.comments,
			currentTheme: data.currentTheme,
			currentUser: data.currentUser,
			hiking: data.hiking,
			notificationSnapshot: data.notificationSnapshot,
		};
	},
	validateSearch: (search) => ({
		commentId: getSingleSearchParam(search.commentId),
	}),
});

function ArticleDetailRoute() {
	const data = Route.useLoaderData();
	const { commentId } = Route.useSearch();

	if (!data.article || !data.hiking || !data.notificationSnapshot) {
		return (
			<ArticleDetailPageView
				article={null as never}
				comments={[]}
				currentTheme={data.currentTheme}
				currentUser={data.currentUser}
				hiking={null as never}
				highlightedCommentId={null}
				notificationSnapshot={null as never}
			/>
		);
	}

	return (
		<ArticleDetailPageView
			{...data}
			highlightedCommentId={toCommentId(commentId)}
		/>
	);
}
