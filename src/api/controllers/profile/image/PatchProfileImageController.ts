import { createRoute } from "@hono/zod-openapi";
import { badRequest } from "#/api/config/apiUtils";
import { requireApiUser } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { okSchema, profileImageBodySchema } from "#/api/schemas";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";
import {
	assertProfileImage,
	getCurrentDisplayName,
	revalidateProfileViews,
} from "../_helpers";

const controller = Controller();

controller.openapi(
	createRoute({
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
	}),
	async (c) => {
		const user = requireApiUser(c.get("currentUser"));
		const values = c.req.valid("json");

		if (!values.removeProfileImage && !values.profileImage) {
			throw badRequest("새 프로필 이미지를 선택해주세요.");
		}

		assertProfileImage(values.profileImage, user.id);

		await applicationUseCaseContext()
			.get("UpdateProfileUseCase")
			.update({
				displayName: getCurrentDisplayName(user),
				email: user.email,
				now: new Date(),
				profileImage: values.profileImage,
				removeProfileImage: values.removeProfileImage,
				userId: user.id,
			});
		revalidateProfileViews();

		return c.json({ ok: true } as const, 200);
	},
);

export default controller;
