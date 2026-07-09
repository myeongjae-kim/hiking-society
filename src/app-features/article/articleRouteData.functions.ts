import { createServerFn } from "@tanstack/react-start";
import {
	readCurrentTheme,
	readCurrentUser,
} from "#/app-features/auth/session.functions";
import type { ArticleId } from "@/core/article/domain";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

export const getArticleRouteData = createServerFn({ method: "GET" })
	.validator((data: { articleId: string }) => data)
	.handler(async ({ data }) => {
		const [currentUser, currentTheme] = await Promise.all([
			readCurrentUser(),
			readCurrentTheme(),
		]);

		if (!currentUser) {
			return { status: "unauthenticated" as const };
		}

		if (!/^\d+$/.test(data.articleId)) {
			return { status: "notFound" as const };
		}

		const articlePage = await applicationUseCaseContext()
			.get("GetArticlePageUseCase")
			.get({
				articleId: data.articleId as ArticleId,
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
