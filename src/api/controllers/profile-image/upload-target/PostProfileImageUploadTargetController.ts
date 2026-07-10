import { createRoute } from "@hono/zod-openapi";
import { requireApiUser } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import {
	profileImageUploadTargetBodySchema,
	profileImageUploadTargetResponseSchema,
} from "#/api/schemas";
import type { ProfileImageUploadUseCase } from "@/core/profile/application/port/in/ProfileImageUploadUseCase";

export function createPostProfileImageUploadTargetController({
	profileImageUploadUseCase,
}: {
	readonly profileImageUploadUseCase: ProfileImageUploadUseCase;
}) {
	const controller = Controller();

	const postProfileImageUploadTargetRoute = createRoute({
		method: "post",
		path: "/profile-image/upload-target",
		request: {
			body: {
				content: {
					"application/json": { schema: profileImageUploadTargetBodySchema },
				},
				required: true,
			},
		},
		responses: {
			200: {
				content: {
					"application/json": {
						schema: profileImageUploadTargetResponseSchema,
					},
				},
				description: "Upload target",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["profile"],
	});

	controller.openapi(postProfileImageUploadTargetRoute, async (c) => {
		const user = requireApiUser(c.get("currentUser"));
		const target = await profileImageUploadUseCase.createUploadTarget({
			...c.req.valid("json"),
			userId: user.id,
		});

		return c.json(profileImageUploadTargetResponseSchema.parse(target), 200);
	});

	return controller;
}
