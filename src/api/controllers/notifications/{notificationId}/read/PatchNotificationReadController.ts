import { createRoute } from "@hono/zod-openapi";
import { toNumericId } from "#/api/config/apiUtils";
import { requireApiUser } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { idParamSchema, okSchema } from "#/api/schemas";
import type { NotificationId } from "@/core/notification/model/Notification";
import type { MarkNotificationReadUseCase } from "@/core/notification/application/port/in/MarkNotificationReadUseCase";

export function createPatchNotificationReadController({
	markNotificationReadUseCase,
}: {
	readonly markNotificationReadUseCase: MarkNotificationReadUseCase;
}) {
	const controller = Controller();

	const patchNotificationReadRoute = createRoute({
		method: "patch",
		path: "/notifications/{notificationId}/read",
		request: { params: idParamSchema.pick({ notificationId: true }) },
		responses: {
			200: {
				content: { "application/json": { schema: okSchema } },
				description: "Read",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["notifications"],
	});

	controller.openapi(patchNotificationReadRoute, async (c) => {
		const user = requireApiUser(c.get("currentUser"));
		await markNotificationReadUseCase.markRead({
			currentUserId: user.id,
			notificationId: toNumericId<NotificationId>(
				c.req.valid("param").notificationId,
				"알림 id",
			),
		});

		return c.json({ ok: true } as const, 200);
	});

	return controller;
}
