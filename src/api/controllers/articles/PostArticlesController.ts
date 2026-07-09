import { createRoute, z } from "@hono/zod-openapi";
import { toHikingId } from "#/api/config/apiUtils";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { articleBodySchema, okSchema } from "#/api/schemas";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

const controller = Controller();

controller.openapi(
	createRoute({
		method: "post",
		path: "/articles",
		request: {
			body: {
				content: {
					"application/json": {
						schema: articleBodySchema.extend({
							hikingId: z.string().regex(/^\d+$/),
						}),
					},
				},
				required: true,
			},
		},
		responses: {
			200: {
				content: { "application/json": { schema: okSchema } },
				description: "Created",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["articles"],
	}),
	async (c) => {
		const user = requireApiRole(c.get("currentUser"), ["admin", "member"]);
		const values = c.req.valid("json");

		await applicationUseCaseContext()
			.get("ArticleCommandUseCase")
			.create({
				authorUserId: user.id,
				body: values.body,
				hikingId: toHikingId(values.hikingId),
				media: values.uploadedMedia,
			});

		return c.json({ ok: true } as const, 200);
	},
);

export default controller;
