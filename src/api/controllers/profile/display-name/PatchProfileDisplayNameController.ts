import { createRoute } from "@hono/zod-openapi";
import { requireApiUser } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { okSchema, updateDisplayNameBodySchema } from "#/api/schemas";
import type { UpdateDisplayNameUseCase } from "@/core/profile/application/port/in/UpdateDisplayNameUseCase";

export function createPatchProfileDisplayNameController({
	updateDisplayNameUseCase,
}: {
	readonly updateDisplayNameUseCase: UpdateDisplayNameUseCase;
}) {
	const controller = Controller();

	const patchProfileDisplayNameRoute = createRoute({
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
	});

	controller.openapi(patchProfileDisplayNameRoute, async (c) => {
		const user = requireApiUser(c.get("currentUser"));
		const values = c.req.valid("json");

		await updateDisplayNameUseCase.updateDisplayName({
			displayName: values.displayName,
			userId: user.id,
		});

		return c.json({ ok: true } as const, 200);
	});

	return controller;
}
