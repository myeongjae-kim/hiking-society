import { createRoute } from "@hono/zod-openapi";
import { notFound, toArticleId } from "#/api/config/apiUtils";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import {
	articleBodySchema,
	articleDetailResponseSchema,
	idParamSchema,
} from "#/api/schemas";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";
import { revalidateArticleSuccess } from "../_helpers";

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

		await applicationUseCaseContext().get("ArticleCommandUseCase").update({
			articleId,
			body: values.body,
			existingMedia: values.existingMedia,
			uploadedMedia: values.uploadedMedia,
			userId: user.id,
		});
		revalidateArticleSuccess(articleId);

		const snapshot = await applicationUseCaseContext()
			.get("GetArticleDetailUseCase")
			.get({
				articleId,
				currentUserId: user.id,
			});

		if (!snapshot) {
			throw notFound("글을 찾을 수 없습니다.");
		}

		return c.json(articleDetailResponseSchema.parse(snapshot), 200);
	},
);

export default controller;
