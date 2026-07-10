import { createRoute } from "@hono/zod-openapi";
import { apiErrorSchema } from "#/api/config/ApiError";
import { forbidden, notFound, toArticleId } from "#/api/config/apiUtils";
import { requireApiUser } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { articleDetailResponseSchema, idParamSchema } from "#/api/schemas";
import type { GetArticlePageUseCase } from "@/core/article/application/port/in/GetArticlePageUseCase";

export function createGetArticleController(
	getArticlePageUseCase: GetArticlePageUseCase,
) {
	const controller = Controller();

	const getArticleRoute = createRoute({
		method: "get",
		path: "/articles/{articleId}",
		request: { params: idParamSchema.pick({ articleId: true }) },
		responses: {
			200: {
				content: {
					"application/json": { schema: articleDetailResponseSchema },
				},
				description: "Article detail",
			},
			404: {
				content: { "application/json": { schema: apiErrorSchema } },
				description: "Not found",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["articles"],
	});

	controller.openapi(getArticleRoute, async (c) => {
		const user = requireApiUser(c.get("currentUser"));
		const articleId = toArticleId(c.req.valid("param").articleId);
		const articlePage = await getArticlePageUseCase.get({
			articleId,
			currentUser: user,
		});

		if (articlePage.status === "associate") {
			throw forbidden();
		}

		if (articlePage.status === "notFound") {
			throw notFound("글을 찾을 수 없습니다.");
		}

		return c.json(
			articleDetailResponseSchema.parse({
				article: articlePage.snapshot.article,
				comments: articlePage.snapshot.comments,
			}),
			200,
		);
	});

	return controller;
}
