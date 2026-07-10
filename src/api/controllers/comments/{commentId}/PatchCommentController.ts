import { createRoute } from "@hono/zod-openapi";
import { toNumericId } from "#/api/config/apiUtils";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { commentBodySchema, idParamSchema, okSchema } from "#/api/schemas";
import type { CommentId } from "@/core/comment/domain";
import type { CommentCommandUseCase } from "@/core/comment/application/port/in/CommentCommandUseCase";

export function createPatchCommentController(
	commentCommandUseCase: CommentCommandUseCase,
) {
	const controller = Controller();

	const patchCommentRoute = createRoute({
		method: "patch",
		path: "/comments/{commentId}",
		request: {
			body: {
				content: {
					"application/json": {
						schema: commentBodySchema.pick({ body: true }),
					},
				},
				required: true,
			},
			params: idParamSchema.pick({ commentId: true }),
		},
		responses: {
			200: {
				content: { "application/json": { schema: okSchema } },
				description: "Updated",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["comments"],
	});

	controller.openapi(patchCommentRoute, async (c) => {
		const user = requireApiRole(c.get("currentUser"), ["admin", "member"]);

		await commentCommandUseCase.update({
			commentId: toNumericId<CommentId>(
				c.req.valid("param").commentId,
				"댓글 id",
			),
			userId: user.id,
			values: { body: c.req.valid("json").body },
		});

		return c.json({ ok: true } as const, 200);
	});

	return controller;
}
