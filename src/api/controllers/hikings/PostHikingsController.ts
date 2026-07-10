import { toHikingValues } from "#/api/config/apiUtils";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { hikingBodySchema, okSchema } from "#/api/schemas";
import { createRoute } from "@hono/zod-openapi";
import type { HikingCommandUseCase } from "@/core/hiking/application/port/in/HikingCommandUseCase";

export function createPostHikingsController({
	hikingCommandUseCase,
}: {
	readonly hikingCommandUseCase: HikingCommandUseCase;
}) {
	const controller = Controller();

	const postHikingsRoute = createRoute({
		method: "post",
		path: "/hikings",
		request: {
			body: {
				content: { "application/json": { schema: hikingBodySchema } },
				required: true,
			},
		},
		responses: {
			200: {
				content: { "application/json": { schema: okSchema } },
				description: "Created",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["hikings"],
	});

	controller.openapi(postHikingsRoute, async (c) => {
		const user = requireApiRole(c.get("currentUser"), ["admin", "member"]);
		const values = toHikingValues(c.req.valid("json"));

		await hikingCommandUseCase.create({
			...values,
			authorUserId: user.id,
		});

		return c.json({ ok: true } as const, 200);
	});

	return controller;
}
