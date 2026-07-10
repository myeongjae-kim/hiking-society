import { createRoute } from "@hono/zod-openapi";
import { deleteCookie } from "hono/cookie";
import { Controller } from "#/api/config/Controller";
import { sessionCookieConfig } from "#/api/config/sessionCookies";
import { okSchema } from "#/api/schemas";

const { accessTokenCookieName, refreshTokenCookieName } = sessionCookieConfig;

export function createPostLogoutController() {
	const controller = Controller();

	const postLogoutRoute = createRoute({
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
	});

	controller.openapi(postLogoutRoute, (c) => {
		deleteCookie(c, accessTokenCookieName, { path: "/" });
		deleteCookie(c, refreshTokenCookieName, { path: "/" });
		return c.json({ ok: true } as const, 200);
	});

	return controller;
}
