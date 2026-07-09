import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	readCurrentTheme,
	readCurrentUser,
} from "#/society-app/auth/session.functions";
import { toNumericSearchId } from "#/routing/searchParams";
import type { ArticleId } from "@/core/article/domain";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

const articleRouteDataInputSchema = z.object({
	articleId: z.string(),
});

export const getArticleRouteData = createServerFn({ method: "GET" })
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

		const articlePage = await applicationUseCaseContext()
			.get("GetArticlePageUseCase")
			.get({
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
