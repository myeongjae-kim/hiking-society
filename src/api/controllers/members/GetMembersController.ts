import { createRoute } from "@hono/zod-openapi";
import { forbidden } from "#/api/config/apiUtils";
import { requireApiUser } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { membersResponseSchema } from "#/api/schemas";
import { toMemberDto } from "./_memberDto";
import type { GetMemberManagementUseCase } from "@/core/member/application/port/in/GetMemberManagementUseCase";

export function createGetMembersController({
	getMemberManagementUseCase,
}: {
	readonly getMemberManagementUseCase: GetMemberManagementUseCase;
}) {
	const controller = Controller();

	const getMembersRoute = createRoute({
		method: "get",
		path: "/members",
		responses: {
			200: {
				content: { "application/json": { schema: membersResponseSchema } },
				description: "Members",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["members"],
	});

	controller.openapi(getMembersRoute, async (c) => {
		const actor = requireApiUser(c.get("currentUser"));
		const data = await getMemberManagementUseCase.get({ actor });

		if (data.status === "forbidden") {
			throw forbidden();
		}

		return c.json(
			membersResponseSchema.parse({
				members: data.members.map(toMemberDto),
			}),
			200,
		);
	});

	return controller;
}
