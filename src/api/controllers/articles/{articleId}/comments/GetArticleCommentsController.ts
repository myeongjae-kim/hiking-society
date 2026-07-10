import { createRoute } from "@hono/zod-openapi";
import { toArticleId } from "#/api/config/apiUtils";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { commentsResponseSchema, idParamSchema } from "#/api/schemas";
import type { ListArticleCommentsUseCase } from "@/core/comment/application/port/in/ListArticleCommentsUseCase";

export function createGetArticleCommentsController({
	listArticleCommentsUseCase,
}: {
	readonly listArticleCommentsUseCase: ListArticleCommentsUseCase;
}) {
	const controller = Controller();

	const getArticleCommentsRoute = createRoute({
		method: "get",
		path: "/articles/{articleId}/comments",
		request: { params: idParamSchema.pick({ articleId: true }) },
		responses: {
			200: {
				content: { "application/json": { schema: commentsResponseSchema } },
				description: "Comments",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["comments"],
	});

	controller.openapi(getArticleCommentsRoute, async (c) => {
		const user = requireApiRole(c.get("currentUser"), ["admin", "member"]);
		const comments = await listArticleCommentsUseCase.listArticleComments({
			articleId: toArticleId(c.req.valid("param").articleId),
			currentUserId: user.id,
		});

		return c.json(commentsResponseSchema.parse({ comments }), 200);
	});

	return controller;
}
