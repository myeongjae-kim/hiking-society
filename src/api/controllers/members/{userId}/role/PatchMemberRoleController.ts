import { createRoute } from "@hono/zod-openapi";
import { assertMutableRole } from "#/api/config/apiUtils";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import {
	idParamSchema,
	okSchema,
	updateMemberRoleBodySchema,
} from "#/api/schemas";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

const controller = Controller();

controller.openapi(
	createRoute({
		method: "patch",
		path: "/members/{userId}/role",
		request: {
			body: {
				content: { "application/json": { schema: updateMemberRoleBodySchema } },
				required: true,
			},
			params: idParamSchema.pick({ userId: true }),
		},
		responses: {
			200: {
				content: { "application/json": { schema: okSchema } },
				description: "Updated",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["members"],
	}),
	async (c) => {
		const actor = requireApiRole(c.get("currentUser"), ["admin", "member"]);
		const nextRole = c.req.valid("json").role;
		assertMutableRole(nextRole);

		await applicationUseCaseContext()
			.get("UpdateMemberRoleUseCase")
			.update({
				actorRole: actor.role,
				nextRole,
				now: new Date(),
				userId: Number(c.req.valid("param").userId),
			});

		return c.json({ ok: true } as const, 200);
	},
);

export default controller;
