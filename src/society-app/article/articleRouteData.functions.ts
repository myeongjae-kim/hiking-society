import { getUseCase } from "#/core/config/getUseCase";
import { toNumericSearchId } from "#/routing/searchParams";
import {
	readCurrentTheme,
	readCurrentUser,
} from "#/society-app/auth/session.functions";
import type { GetArticlePageUseCase } from "@/core/article/application/port/in/GetArticlePageUseCase";
import type { ArticleId } from "@/core/article/domain";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const articleRouteDataInputSchema = z.object({
	articleId: z.string(),
});

type GetArticleRouteDataDeps = {
	readonly getArticlePageUseCase: GetArticlePageUseCase;
	readonly readCurrentTheme: typeof readCurrentTheme;
	readonly readCurrentUser: typeof readCurrentUser;
};

async function getArticleRouteDataHandler({
	data,
	getArticlePageUseCase,
	readCurrentTheme,
	readCurrentUser,
}: GetArticleRouteDataDeps & {
	readonly data: z.infer<typeof articleRouteDataInputSchema>;
}) {
	const currentUser = await readCurrentUser();
	const currentTheme = await readCurrentTheme();

	if (!currentUser) {
		return { status: "unauthenticated" as const };
	}

	const articleId = toNumericSearchId<ArticleId>(data.articleId);

	if (!articleId) {
		return { status: "notFound" as const };
	}

	const articlePage = await getArticlePageUseCase.get({
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
}

export const getArticleRouteData = createServerFn({ method: "GET" })
	.validator(articleRouteDataInputSchema)
	.handler(async ({ data }) =>
		getArticleRouteDataHandler({
			data,
			getArticlePageUseCase: getUseCase("GetArticlePageUseCase"),
			readCurrentTheme,
			readCurrentUser,
		}),
	);
