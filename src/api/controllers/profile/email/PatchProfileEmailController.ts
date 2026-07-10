import { createRoute } from "@hono/zod-openapi";
import { setCookie } from "hono/cookie";
import { requireApiUser } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import {
	cookieOptions,
	sessionCookieConfig,
} from "#/api/config/sessionCookies";
import { okSchema, updateEmailBodySchema } from "#/api/schemas";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";

const controller = Controller();
const {
	accessTokenCookieName,
	accessTokenMaxAgeSeconds,
	refreshTokenCookieName,
	refreshTokenMaxAgeSeconds,
} = sessionCookieConfig;

controller.openapi(
	createRoute({
		method: "patch",
		path: "/profile/email",
		request: {
			body: {
				content: { "application/json": { schema: updateEmailBodySchema } },
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

		await applicationUseCaseContext().get("UpdateEmailUseCase").updateEmail({
			email: values.email,
			userId: user.id,
		});

		if (values.email !== user.email && user.provider) {
			const { accessToken, refreshToken } = await applicationUseCaseContext()
				.get("CreateSessionTokenUseCase")
				.create({
					email: values.email,
					provider: user.provider,
					role: user.role,
					userId: user.id,
				});

			setCookie(
				c,
				accessTokenCookieName,
				accessToken,
				cookieOptions(accessTokenMaxAgeSeconds),
			);
			setCookie(
				c,
				refreshTokenCookieName,
				refreshToken,
				cookieOptions(refreshTokenMaxAgeSeconds),
			);
		}

		return c.json({ ok: true } as const, 200);
	},
);

export default controller;
