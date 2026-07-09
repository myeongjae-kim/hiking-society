import { createRoute } from "@hono/zod-openapi";
import { apiErrorSchema } from "#/api/config/ApiError";
import { forbidden } from "#/api/config/apiUtils";
import { requireApiUser } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { feedResponseSchema } from "#/api/schemas";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

const controller = Controller();

controller.openapi(
	createRoute({
		method: "get",
		path: "/feed",
		responses: {
			200: {
				content: { "application/json": { schema: feedResponseSchema } },
				description: "Feed",
			},
			401: {
				content: { "application/json": { schema: apiErrorSchema } },
				description: "Unauthorized",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["feed"],
	}),
	async (c) => {
		const user = requireApiUser(c.get("currentUser"));
		const feedHome = await applicationUseCaseContext()
			.get("GetFeedHomeUseCase")
			.get({ currentUser: user });

		if (feedHome.status === "associate") {
			throw forbidden();
		}

		return c.json(feedResponseSchema.parse(feedHome.feedSummary), 200);
	},
);

export default controller;
