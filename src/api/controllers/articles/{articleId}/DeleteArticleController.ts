import { createRoute } from "@hono/zod-openapi";
import { toArticleId } from "#/api/config/apiUtils";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { idParamSchema, okSchema } from "#/api/schemas";
import type { ArticleCommandUseCase } from "@/core/article/application/port/in/ArticleCommandUseCase";

export function createDeleteArticleController({
	articleCommandUseCase,
}: {
	readonly articleCommandUseCase: ArticleCommandUseCase;
}) {
	const controller = Controller();

	const deleteArticleRoute = createRoute({
		method: "delete",
		path: "/articles/{articleId}",
		request: { params: idParamSchema.pick({ articleId: true }) },
		responses: {
			200: {
				content: { "application/json": { schema: okSchema } },
				description: "Deleted",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["articles"],
	});

	controller.openapi(deleteArticleRoute, async (c) => {
		const user = requireApiRole(c.get("currentUser"), ["admin", "member"]);
		const articleId = toArticleId(c.req.valid("param").articleId);

		await articleCommandUseCase.delete({
			articleId,
			userId: user.id,
		});

		return c.json({ ok: true } as const, 200);
	});

	return controller;
}
