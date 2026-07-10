import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getUseCase } from "#/infrastructure/config/getUseCase";
import ArticleDetailPageView from "#/society/article/ArticleDetailPageView";
import { getLoginRedirectHref } from "#/society/auth/session.shared";
import { AssociateFeedNotice } from "#/society/feed/components/AssociateFeedNotice";
import { toNumericSearchId } from "#/routing/searchParams";
import {
	readCurrentTheme,
	readCurrentUser,
} from "#/society-app/auth/session.functions";
import type { ArticleId } from "@/core/article/domain";
import type { CommentViewId as CommentId } from "#/society/shared/viewModels";

const articleRouteDataInputSchema = z.object({
	articleId: z.string(),
});

const getArticleRouteData = createServerFn({ method: "GET" })
	.validator(articleRouteDataInputSchema)
	.handler(async ({ data }) => {
		const currentUser = await readCurrentUser();
		const currentTheme = await readCurrentTheme();

		if (!currentUser) {
			return { status: "unauthenticated" as const };
		}

		const articleId = toNumericSearchId<ArticleId>(data.articleId);

		if (!articleId) {
			return { status: "notFound" as const };
		}

		const articlePage = await getUseCase("GetArticlePageUseCase").get({
			articleId,
			currentUser,
			includeNotifications: true,
		});

		if (articlePage.status === "associate") {
			return {
				currentTheme,
				currentUser,
				status: "associate" as const,
			};
		}

		if (articlePage.status === "notFound") {
			return { status: "notFound" as const };
		}

		if (!articlePage.notificationSnapshot) {
			throw new Error("Article route notification snapshot was not loaded.");
		}

		return {
			article: articlePage.snapshot.article,
			comments: articlePage.snapshot.comments,
			currentTheme,
			currentUser,
			hiking: articlePage.snapshot.hiking,
			notificationSnapshot: articlePage.notificationSnapshot,
			status: "ok" as const,
		};
	});

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
				currentUser: data.currentUser,
				status: "associate" as const,
			};
		}

		return {
			article: data.article,
			comments: data.comments,
			currentTheme: data.currentTheme,
			currentUser: data.currentUser,
			hiking: data.hiking,
			notificationSnapshot: data.notificationSnapshot,
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
