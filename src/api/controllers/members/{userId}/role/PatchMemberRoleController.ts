import { createRoute } from "@hono/zod-openapi";
import { assertMutableRole } from "#/api/config/apiUtils";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import {
	idParamSchema,
	okSchema,
	updateMemberRoleBodySchema,
} from "#/api/schemas";
import type { UpdateMemberRoleUseCase } from "@/core/member/application/port/in/UpdateMemberRoleUseCase";

export function createPatchMemberRoleController({
	updateMemberRoleUseCase,
}: {
	readonly updateMemberRoleUseCase: UpdateMemberRoleUseCase;
}) {
	const controller = Controller();

	const patchMemberRoleRoute = createRoute({
		method: "patch",
		path: "/members/{userId}/role",
		request: {
			body: {
				content: {
					"application/json": { schema: updateMemberRoleBodySchema },
				},
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
	});

	controller.openapi(patchMemberRoleRoute, async (c) => {
		const actor = requireApiRole(c.get("currentUser"), ["admin", "member"]);
		const nextRole = c.req.valid("json").role;
		assertMutableRole(nextRole);

		await updateMemberRoleUseCase.update({
			actorRole: actor.role,
			nextRole,
			userId: Number(c.req.valid("param").userId),
		});

		return c.json({ ok: true } as const, 200);
	});

	return controller;
}
