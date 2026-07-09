import { createRoute } from "@hono/zod-openapi";
import { toHikingId } from "#/api/config/apiUtils";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { hikingArticlesResponseSchema, idParamSchema } from "#/api/schemas";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

const controller = Controller();

controller.openapi(
	createRoute({
		method: "get",
		path: "/feed/hikings/{hikingId}/articles",
		request: { params: idParamSchema.pick({ hikingId: true }) },
		responses: {
			200: {
				content: {
					"application/json": { schema: hikingArticlesResponseSchema },
				},
				description: "Hiking articles",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["feed"],
	}),
	async (c) => {
		const user = requireApiRole(c.get("currentUser"), ["admin", "member"]);
		const snapshot = await applicationUseCaseContext()
			.get("ListFeedUseCase")
			.listHikingArticles({
				currentUserId: user.id,
				hikingId: toHikingId(c.req.valid("param").hikingId),
			});

		return c.json(hikingArticlesResponseSchema.parse(snapshot), 200);
	},
);

export default controller;
