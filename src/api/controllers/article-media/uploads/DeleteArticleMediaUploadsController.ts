import { createRoute } from "@hono/zod-openapi";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { cleanupUploadsBodySchema, okSchema } from "#/api/schemas";
import type { ArticleMediaUploadUseCase } from "@/core/article/application/port/in/ArticleMediaUploadUseCase";

export function createDeleteArticleMediaUploadsController({
	articleMediaUploadUseCase,
}: {
	readonly articleMediaUploadUseCase: ArticleMediaUploadUseCase;
}) {
	const controller = Controller();

	const deleteArticleMediaUploadsRoute = createRoute({
		method: "delete",
		path: "/article-media/uploads",
		request: {
			body: {
				content: { "application/json": { schema: cleanupUploadsBodySchema } },
				required: true,
			},
		},
		responses: {
			200: {
				content: { "application/json": { schema: okSchema } },
				description: "Cleaned",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["articles"],
	});

	controller.openapi(deleteArticleMediaUploadsRoute, async (c) => {
		const user = requireApiRole(c.get("currentUser"), ["admin", "member"]);
		await articleMediaUploadUseCase.deleteUploads({
			objectKeys: c.req.valid("json").objectKeys,
			userId: user.id,
		});
		return c.json({ ok: true } as const, 200);
	});

	return controller;
}
