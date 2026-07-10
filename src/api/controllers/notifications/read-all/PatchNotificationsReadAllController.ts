import { createRoute } from "@hono/zod-openapi";
import { requireApiUser } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { okSchema } from "#/api/schemas";
import type { MarkAllNotificationsReadUseCase } from "@/core/notification/application/port/in/MarkAllNotificationsReadUseCase";

export function createPatchNotificationsReadAllController({
	markAllNotificationsReadUseCase,
}: {
	readonly markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase;
}) {
	const controller = Controller();

	const patchNotificationsReadAllRoute = createRoute({
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
	});

	controller.openapi(patchNotificationsReadAllRoute, async (c) => {
		const user = requireApiUser(c.get("currentUser"));
		await markAllNotificationsReadUseCase.markAllRead({
			currentUserId: user.id,
		});

		return c.json({ ok: true } as const, 200);
	});

	return controller;
}
