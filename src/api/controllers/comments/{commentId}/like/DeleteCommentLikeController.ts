import { createRoute } from "@hono/zod-openapi";
import { toNumericId } from "#/api/config/apiUtils";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { idParamSchema, okSchema } from "#/api/schemas";
import type { CommentId } from "@/core/comment/domain";
import type { LikeCommandUseCase } from "@/core/like/application/port/in/LikeCommandUseCase";

export function createDeleteCommentLikeController({
	likeCommandUseCase,
}: {
	readonly likeCommandUseCase: LikeCommandUseCase;
}) {
	const controller = Controller();

	const deleteCommentLikeRoute = createRoute({
		method: "delete",
		path: "/comments/{commentId}/like",
		request: { params: idParamSchema.pick({ commentId: true }) },
		responses: {
			200: {
				content: { "application/json": { schema: okSchema } },
				description: "Toggled",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["comments"],
	});

	controller.openapi(deleteCommentLikeRoute, async (c) => {
		const user = requireApiRole(c.get("currentUser"), ["admin", "member"]);
		await likeCommandUseCase.toggleCommentLike({
			commentId: toNumericId<CommentId>(
				c.req.valid("param").commentId,
				"댓글 id",
			),
			userId: user.id,
		});

		return c.json({ ok: true } as const, 200);
	});

	return controller;
}
