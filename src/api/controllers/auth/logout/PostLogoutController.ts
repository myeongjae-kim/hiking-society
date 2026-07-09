import { createRoute } from "@hono/zod-openapi";
import { deleteCookie } from "hono/cookie";
import { Controller } from "#/api/config/Controller";
import { sessionCookieConfig } from "#/api/config/sessionCookies";
import { okSchema } from "#/api/schemas";

const controller = Controller();
const { accessTokenCookieName, refreshTokenCookieName } = sessionCookieConfig;

controller.openapi(
	createRoute({
		method: "post",
		path: "/auth/logout",
		responses: {
			200: {
				content: { "application/json": { schema: okSchema } },
				description: "Logged out",
			},
		},
		security: [{ cookieAuth: [] }],
		tags: ["auth"],
	}),
	(c) => {
		deleteCookie(c, accessTokenCookieName, { path: "/" });
		deleteCookie(c, refreshTokenCookieName, { path: "/" });
		return c.json({ ok: true } as const, 200);
	},
);

export default controller;
