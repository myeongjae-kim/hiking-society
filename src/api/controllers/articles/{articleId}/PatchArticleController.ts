import { createRoute } from "@hono/zod-openapi";
import { notFound, toArticleId, toArticleMedia } from "#/api/config/apiUtils";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import {
	articleBodySchema,
	articleDetailResponseSchema,
	idParamSchema,
} from "#/api/schemas";
import { applicationContext } from "@/core/config/applicationContext.server";
import { revalidateArticleSuccess, validateUploadedMedia } from "../_helpers";

const controller = Controller();

controller.openapi(
	createRoute({
		method: "patch",
		path: "/articles/{articleId}",
		request: {
			body: {
				content: { "application/json": { schema: articleBodySchema } },
				required: true,
			},
			params: idParamSchema.pick({ articleId: true }),
		},
		responses: {
			200: {
				content: {
					"application/json": { schema: articleDetailResponseSchema },
				},
				description: "Updated article detail",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["articles"],
	}),
	async (c) => {
		const user = requireApiRole(c.get("currentUser"), ["admin", "member"]);
		const articleId = toArticleId(c.req.valid("param").articleId);
		const values = c.req.valid("json");

		validateUploadedMedia(user.id, values.uploadedMedia);
		await applicationContext()
			.get("ArticleCommandUseCase")
			.update({
				articleId,
				body: values.body,
				media: toArticleMedia(values),
				userId: user.id,
			});
		revalidateArticleSuccess(articleId);

		const snapshot = await applicationContext()
			.get("GetArticleDetailUseCase")
			.get({ articleId, currentUserId: user.id });

		if (!snapshot) {
			throw notFound("글을 찾을 수 없습니다.");
		}

		return c.json(articleDetailResponseSchema.parse(snapshot), 200);
	},
);

export default controller;
