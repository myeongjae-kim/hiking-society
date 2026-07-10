import { createRoute } from "@hono/zod-openapi";
import { toArticleId, toCommentId } from "#/api/config/apiUtils";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { commentBodySchema, idParamSchema, okSchema } from "#/api/schemas";
import type { CommentCommandUseCase } from "@/core/comment/application/port/in/CommentCommandUseCase";

export function createPostArticleCommentsController(
	commentCommandUseCase: CommentCommandUseCase,
) {
	const controller = Controller();

	const postArticleCommentsRoute = createRoute({
		method: "post",
		path: "/articles/{articleId}/comments",
		request: {
			body: {
				content: { "application/json": { schema: commentBodySchema } },
				required: true,
			},
			params: idParamSchema.pick({ articleId: true }),
		},
		responses: {
			200: {
				content: { "application/json": { schema: okSchema } },
				description: "Created",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["comments"],
	});

	controller.openapi(postArticleCommentsRoute, async (c) => {
		const user = requireApiRole(c.get("currentUser"), ["admin", "member"]);
		const articleId = toArticleId(c.req.valid("param").articleId);
		const values = c.req.valid("json");

		await commentCommandUseCase.create(
			values.parentCommentId
				? {
						articleId,
						authorUserId: user.id,
						body: values.body,
						parentCommentId: toCommentId(values.parentCommentId),
					}
				: { articleId, authorUserId: user.id, body: values.body },
		);

		return c.json({ ok: true } as const, 200);
	});

	return controller;
}
