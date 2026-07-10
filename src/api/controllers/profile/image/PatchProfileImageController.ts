import { createRoute } from "@hono/zod-openapi";
import { requireApiUser } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { okSchema, profileImageBodySchema } from "#/api/schemas";
import type { UpdateProfileImageUseCase } from "@/core/profile/application/port/in/UpdateProfileImageUseCase";

export function createPatchProfileImageController({
	updateProfileImageUseCase,
}: {
	readonly updateProfileImageUseCase: UpdateProfileImageUseCase;
}) {
	const controller = Controller();

	const patchProfileImageRoute = createRoute({
		method: "patch",
		path: "/profile/image",
		request: {
			body: {
				content: { "application/json": { schema: profileImageBodySchema } },
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

	controller.openapi(patchProfileImageRoute, async (c) => {
		const user = requireApiUser(c.get("currentUser"));
		const values = c.req.valid("json");

		await updateProfileImageUseCase.updateProfileImage({
			profileImage: values.profileImage,
			removeProfileImage: values.removeProfileImage,
			userId: user.id,
		});

		return c.json({ ok: true } as const, 200);
	});

	return controller;
}
