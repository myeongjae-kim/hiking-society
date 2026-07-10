import { createRoute } from "@hono/zod-openapi";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import {
	articleMediaUploadTargetsBodySchema,
	articleMediaUploadTargetsResponseSchema,
} from "#/api/schemas";
import type { ArticleMediaUploadUseCase } from "@/core/article/application/port/in/ArticleMediaUploadUseCase";

export function createPostArticleMediaUploadTargetsController({
	articleMediaUploadUseCase,
}: {
	readonly articleMediaUploadUseCase: ArticleMediaUploadUseCase;
}) {
	const controller = Controller();

	const postArticleMediaUploadTargetsRoute = createRoute({
		method: "post",
		path: "/article-media/upload-targets",
		request: {
			body: {
				content: {
					"application/json": { schema: articleMediaUploadTargetsBodySchema },
				},
				required: true,
			},
		},
		responses: {
			200: {
				content: {
					"application/json": {
						schema: articleMediaUploadTargetsResponseSchema,
					},
				},
				description: "Upload targets",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["articles"],
	});

	controller.openapi(postArticleMediaUploadTargetsRoute, async (c) => {
		const user = requireApiRole(c.get("currentUser"), ["admin", "member"]);
		const targets = await articleMediaUploadUseCase.createUploadTargets({
			targets: c.req.valid("json"),
			userId: user.id,
		});

		return c.json(
			articleMediaUploadTargetsResponseSchema.parse({ targets }),
			200,
		);
	});

	return controller;
}
