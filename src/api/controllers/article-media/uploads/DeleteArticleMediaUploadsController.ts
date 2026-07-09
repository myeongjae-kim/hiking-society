import { createRoute } from "@hono/zod-openapi";
import { requireApiRole } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { cleanupUploadsBodySchema, okSchema } from "#/api/schemas";
import { applicationContext } from "@/core/config/applicationContext.server";

const controller = Controller();

controller.openapi(
	createRoute({
		method: "delete",
		path: "/article-media/uploads",
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
		tags: ["articles"],
	}),
	async (c) => {
		const user = requireApiRole(c.get("currentUser"), ["admin", "member"]);
		await applicationContext()
			.get("MediaStoragePort")
			.deleteObjects({
				objectKeys: c.req.valid("json").objectKeys,
				userId: user.id,
			});
		return c.json({ ok: true } as const, 200);
	},
);

export default controller;
