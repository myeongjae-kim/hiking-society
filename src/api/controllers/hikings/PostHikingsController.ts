import { createRoute } from "@hono/zod-openapi";
import { toHikingValues } from "#/api/config/apiUtils";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { hikingBodySchema, okSchema } from "#/api/schemas";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

const controller = Controller();

controller.openapi(
	createRoute({
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
	}),
	async (c) => {
		const user = requireApiRole(c.get("currentUser"), ["admin", "member"]);
		const values = toHikingValues(c.req.valid("json"));

		await applicationUseCaseContext()
			.get("HikingCommandUseCase")
			.create({
				...values,
				authorUserId: user.id,
			});

		return c.json({ ok: true } as const, 200);
	},
);

export default controller;
