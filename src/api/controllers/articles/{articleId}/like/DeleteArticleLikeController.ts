import { createRoute } from "@hono/zod-openapi";
import { toArticleId } from "#/api/config/apiUtils";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { idParamSchema, okSchema } from "#/api/schemas";
import type { LikeCommandUseCase } from "@/core/like/application/port/in/LikeCommandUseCase";

export function createDeleteArticleLikeController({
	likeCommandUseCase,
}: {
	readonly likeCommandUseCase: LikeCommandUseCase;
}) {
	const controller = Controller();

	const deleteArticleLikeRoute = createRoute({
		method: "delete",
		path: "/articles/{articleId}/like",
		request: { params: idParamSchema.pick({ articleId: true }) },
		responses: {
			200: {
				content: { "application/json": { schema: okSchema } },
				description: "Toggled",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["articles"],
	});

	controller.openapi(deleteArticleLikeRoute, async (c) => {
		const user = requireApiRole(c.get("currentUser"), ["admin", "member"]);
		const articleId = toArticleId(c.req.valid("param").articleId);

		await likeCommandUseCase.toggleArticleLike({
			articleId,
			userId: user.id,
		});

		return c.json({ ok: true } as const, 200);
	});

	return controller;
}
