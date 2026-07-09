import { createRoute } from "@hono/zod-openapi";
import { apiErrorSchema } from "#/api/config/ApiError";
import { notFound, toArticleId } from "#/api/config/apiUtils";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { articleDetailResponseSchema, idParamSchema } from "#/api/schemas";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

const controller = Controller();

controller.openapi(
	createRoute({
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
	}),
	async (c) => {
		const user = requireApiRole(c.get("currentUser"), ["admin", "member"]);
		const articleId = toArticleId(c.req.valid("param").articleId);
		const snapshot = await applicationUseCaseContext()
			.get("GetArticleDetailUseCase")
			.get({
				articleId,
				currentUserId: user.id,
			});

		if (!snapshot) {
			throw notFound("글을 찾을 수 없습니다.");
		}

		return c.json(articleDetailResponseSchema.parse(snapshot), 200);
	},
);

export default controller;
