import { createRoute } from "@hono/zod-openapi";
import { toHikingId } from "#/api/config/apiUtils";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { idParamSchema, okSchema } from "#/api/schemas";
import type { HikingCommandUseCase } from "@/core/hiking/application/port/in/HikingCommandUseCase";

export function createDeleteHikingController({
	hikingCommandUseCase,
}: {
	readonly hikingCommandUseCase: HikingCommandUseCase;
}) {
	const controller = Controller();

	const deleteHikingRoute = createRoute({
		method: "delete",
		path: "/hikings/{hikingId}",
		request: { params: idParamSchema.pick({ hikingId: true }) },
		responses: {
			200: {
				content: { "application/json": { schema: okSchema } },
				description: "Deleted",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["hikings"],
	});

	controller.openapi(deleteHikingRoute, async (c) => {
		const user = requireApiRole(c.get("currentUser"), ["admin", "member"]);

		await hikingCommandUseCase.delete({
			hikingId: toHikingId(c.req.valid("param").hikingId),
			userId: user.id,
		});

		return c.json({ ok: true } as const, 200);
	});

	return controller;
}
