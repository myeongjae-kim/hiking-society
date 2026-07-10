import { createRoute } from "@hono/zod-openapi";
import { toHikingId, toHikingValues } from "#/api/config/apiUtils";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { hikingBodySchema, idParamSchema, okSchema } from "#/api/schemas";
import type { HikingCommandUseCase } from "@/core/hiking/application/port/in/HikingCommandUseCase";

export function createPatchHikingController(
	hikingCommandUseCase: HikingCommandUseCase,
) {
	const controller = Controller();

	const patchHikingRoute = createRoute({
		method: "patch",
		path: "/hikings/{hikingId}",
		request: {
			body: {
				content: { "application/json": { schema: hikingBodySchema } },
				required: true,
			},
			params: idParamSchema.pick({ hikingId: true }),
		},
		responses: {
			200: {
				content: { "application/json": { schema: okSchema } },
				description: "Updated",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["hikings"],
	});

	controller.openapi(patchHikingRoute, async (c) => {
		const user = requireApiRole(c.get("currentUser"), ["admin", "member"]);

		await hikingCommandUseCase.update({
			hikingId: toHikingId(c.req.valid("param").hikingId),
			userId: user.id,
			values: toHikingValues(c.req.valid("json")),
		});

		return c.json({ ok: true } as const, 200);
	});

	return controller;
}
