import { createRoute } from "@hono/zod-openapi";
import { requireApiUser } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { cleanupUploadsBodySchema, okSchema } from "#/api/schemas";
import type { ProfileImageUploadUseCase } from "@/core/profile/application/port/in/ProfileImageUploadUseCase";

export function createDeleteProfileImageUploadsController(
	profileImageUploadUseCase: ProfileImageUploadUseCase,
) {
	const controller = Controller();

	const deleteProfileImageUploadsRoute = createRoute({
		method: "delete",
		path: "/profile-image/uploads",
		request: {
			body: {
				content: { "application/json": { schema: cleanupUploadsBodySchema } },
				required: true,
			},
		},
		responses: {
			200: {
				content: { "application/json": { schema: okSchema } },
				description: "Cleaned",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["profile"],
	});

	controller.openapi(deleteProfileImageUploadsRoute, async (c) => {
		const user = requireApiUser(c.get("currentUser"));
		await profileImageUploadUseCase.deleteUploads({
			objectKeys: c.req.valid("json").objectKeys,
			userId: user.id,
		});
		return c.json({ ok: true } as const, 200);
	});

	return controller;
}
