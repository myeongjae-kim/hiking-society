import { createRoute } from "@hono/zod-openapi";
import { requireApiUser } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import {
	notificationListResponseSchema,
	notificationsQuerySchema,
} from "#/api/schemas";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

const controller = Controller();

controller.openapi(
	createRoute({
		method: "get",
		path: "/notifications",
		request: { query: notificationsQuerySchema },
		responses: {
			200: {
				content: {
					"application/json": { schema: notificationListResponseSchema },
				},
				description: "Notifications",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["notifications"],
	}),
	async (c) => {
		const user = requireApiUser(c.get("currentUser"));
		const query = c.req.valid("query");
		const snapshot = await applicationUseCaseContext()
			.get("ListNotificationsUseCase")
			.list({
				currentUserId: user.id,
				limit: query.limit,
				offset: query.offset,
			});

		return c.json(notificationListResponseSchema.parse(snapshot), 200);
	},
);

export default controller;
