import { createRoute } from "@hono/zod-openapi";
import { apiErrorSchema } from "#/api/config/ApiError";
import { forbidden } from "#/api/config/apiUtils";
import { requireApiUser } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { feedResponseSchema } from "#/api/schemas";
import type { GetFeedHomeUseCase } from "@/core/feed/application/port/in/GetFeedHomeUseCase";

export function createGetFeedController(
	getFeedHomeUseCase: GetFeedHomeUseCase,
) {
	const controller = Controller();

	const getFeedRoute = createRoute({
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
	});

	controller.openapi(getFeedRoute, async (c) => {
		const user = requireApiUser(c.get("currentUser"));
		const feedHome = await getFeedHomeUseCase.get({
			currentUser: user,
		});

		if (feedHome.status === "associate") {
			throw forbidden();
		}

		return c.json(feedResponseSchema.parse(feedHome.feedSummary), 200);
	});

	return controller;
}
