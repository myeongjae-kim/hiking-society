import { createRoute } from "@hono/zod-openapi";
import { requireApiUser } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { okSchema, updateDisplayNameBodySchema } from "#/api/schemas";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

const controller = Controller();

controller.openapi(
	createRoute({
		method: "patch",
		path: "/profile/display-name",
		request: {
			body: {
				content: {
					"application/json": { schema: updateDisplayNameBodySchema },
				},
				required: true,
			},
		},
		responses: {
			200: {
				content: { "application/json": { schema: okSchema } },
				description: "Updated",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["profile"],
	}),
	async (c) => {
		const user = requireApiUser(c.get("currentUser"));
		const values = c.req.valid("json");

		await applicationUseCaseContext()
			.get("UpdateDisplayNameUseCase")
			.updateDisplayName({
				displayName: values.displayName,
				userId: user.id,
			});

		return c.json({ ok: true } as const, 200);
	},
);

export default controller;
