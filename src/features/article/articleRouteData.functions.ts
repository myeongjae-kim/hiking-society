import { createServerFn } from "@tanstack/react-start";
import {
	readCurrentTheme,
	readCurrentUser,
} from "#/features/auth/session.functions";
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

		if (currentUser.role === "associate") {
			return {
				currentTheme,
				currentUser,
				status: "associate" as const,
			};
		}

		const services = applicationUseCaseContext();
		const [snapshot, notificationSnapshot] = await Promise.all([
			services.get("GetArticleDetailUseCase").get({
				articleId: data.articleId as ArticleId,
				currentUserId: currentUser.id,
			}),
			services
				.get("ListNotificationsUseCase")
				.list({ currentUserId: currentUser.id }),
		]);

		if (!snapshot) {
			return { status: "notFound" as const };
		}

		return {
			article: snapshot.article,
			comments: snapshot.comments,
			currentTheme,
			currentUser,
			hiking: snapshot.hiking,
			notificationSnapshot,
			status: "ok" as const,
		};
	});
