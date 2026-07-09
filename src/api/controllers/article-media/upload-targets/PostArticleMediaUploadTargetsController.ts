import { createRoute } from "@hono/zod-openapi";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import {
	articleMediaUploadTargetsBodySchema,
	articleMediaUploadTargetsResponseSchema,
} from "#/api/schemas";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

const controller = Controller();

controller.openapi(
	createRoute({
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
	}),
	async (c) => {
		const user = requireApiRole(c.get("currentUser"), ["admin", "member"]);
		const targets = await applicationUseCaseContext()
			.get("ArticleMediaUploadUseCase")
			.createUploadTargets({
				targets: c.req.valid("json"),
				userId: user.id,
			});

		return c.json(
			articleMediaUploadTargetsResponseSchema.parse({ targets }),
			200,
		);
	},
);

export default controller;
