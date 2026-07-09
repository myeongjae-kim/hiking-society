import { createRoute } from "@hono/zod-openapi";
import { requireApiUser } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { okSchema } from "#/api/schemas";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

const controller = Controller();

controller.openapi(
	createRoute({
		method: "patch",
		path: "/notifications/read-all",
		responses: {
			200: {
				content: { "application/json": { schema: okSchema } },
				description: "Read all",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["notifications"],
	}),
	async (c) => {
		const user = requireApiUser(c.get("currentUser"));
		await applicationUseCaseContext()
			.get("MarkAllNotificationsReadUseCase")
			.markAllRead({
				currentUserId: user.id,
			});

		return c.json({ ok: true } as const, 200);
	},
);

export default controller;
