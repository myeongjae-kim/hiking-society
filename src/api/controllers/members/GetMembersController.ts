import { createRoute } from "@hono/zod-openapi";
import { forbidden } from "#/api/config/apiUtils";
import { requireApiUser } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { membersResponseSchema } from "#/api/schemas";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";
import { toMemberDto } from "./_memberDto";

const controller = Controller();

controller.openapi(
	createRoute({
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
	}),
	async (c) => {
		const actor = requireApiUser(c.get("currentUser"));
		const data = await applicationUseCaseContext()
			.get("GetMemberManagementUseCase")
			.get({ actor });

		if (data.status === "forbidden") {
			throw forbidden();
		}

		return c.json(
			membersResponseSchema.parse({
				members: data.members.map(toMemberDto),
			}),
			200,
		);
	},
);

export default controller;
