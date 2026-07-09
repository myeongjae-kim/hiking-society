import { createRoute } from "@hono/zod-openapi";
import { toHikingId } from "#/api/config/apiUtils";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { idParamSchema, okSchema } from "#/api/schemas";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

const controller = Controller();

controller.openapi(
	createRoute({
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
	}),
	async (c) => {
		const user = requireApiRole(c.get("currentUser"), ["admin", "member"]);

		await applicationUseCaseContext()
			.get("HikingCommandUseCase")
			.delete({
				hikingId: toHikingId(c.req.valid("param").hikingId),
				userId: user.id,
			});

		return c.json({ ok: true } as const, 200);
	},
);

export default controller;
