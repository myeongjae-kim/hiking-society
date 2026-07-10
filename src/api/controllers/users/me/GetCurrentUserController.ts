import { createRoute } from "@hono/zod-openapi";
import { apiErrorSchema } from "#/api/config/ApiError";
import { requireApiUser } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { currentUserSchema } from "#/api/schemas";

export function createGetCurrentUserController() {
	const controller = Controller();

	const getCurrentUserRoute = createRoute({
		method: "get",
		path: "/users/me",
		responses: {
			200: {
				content: { "application/json": { schema: currentUserSchema } },
				description: "Current user",
			},
			401: {
				content: { "application/json": { schema: apiErrorSchema } },
				description: "Unauthorized",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["auth"],
	});

	controller.openapi(getCurrentUserRoute, (c) =>
		c.json(currentUserSchema.parse(requireApiUser(c.get("currentUser"))), 200),
	);

	return controller;
}
