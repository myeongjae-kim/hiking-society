import { createRoute } from "@hono/zod-openapi";
import { requireApiUser } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import {
	profileImageUploadTargetBodySchema,
	profileImageUploadTargetResponseSchema,
} from "#/api/schemas";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

const controller = Controller();

controller.openapi(
	createRoute({
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
	}),
	async (c) => {
		const user = requireApiUser(c.get("currentUser"));
		const target = await applicationUseCaseContext()
			.get("ProfileImageUploadUseCase")
			.createUploadTarget({
				...c.req.valid("json"),
				userId: user.id,
			});

		return c.json(profileImageUploadTargetResponseSchema.parse(target), 200);
	},
);

export default controller;
