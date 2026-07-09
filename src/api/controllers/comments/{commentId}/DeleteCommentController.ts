import { createRoute } from "@hono/zod-openapi";
import { toNumericId } from "#/api/config/apiUtils";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { idParamSchema, okSchema } from "#/api/schemas";
import type { CommentId } from "@/core/comment/domain";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

const controller = Controller();

controller.openapi(
	createRoute({
		method: "delete",
		path: "/comments/{commentId}",
		request: { params: idParamSchema.pick({ commentId: true }) },
		responses: {
			200: {
				content: { "application/json": { schema: okSchema } },
				description: "Deleted",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["comments"],
	}),
	async (c) => {
		const user = requireApiRole(c.get("currentUser"), ["admin", "member"]);

		await applicationUseCaseContext()
			.get("CommentCommandUseCase")
			.delete({
				commentId: toNumericId<CommentId>(
					c.req.valid("param").commentId,
					"댓글 id",
				),
				userId: user.id,
			});

		return c.json({ ok: true } as const, 200);
	},
);

export default controller;
