import { createRoute } from "@hono/zod-openapi";
import { setCookie } from "hono/cookie";
import { requireApiUser } from "#/api/config/auth";
import { Controller } from "#/api/config/Controller";
import { sessionCookieConfig } from "#/api/config/sessionCookies";
import { okSchema, updateEmailBodySchema } from "#/api/schemas";
import type { GetCookieOptionsUseCase } from "@/core/auth/application/port/in/GetCookieOptionsUseCase";
import type { CreateSessionTokenUseCase } from "@/core/auth/application/port/in/CreateSessionTokenUseCase";
import type { UpdateEmailUseCase } from "@/core/profile/application/port/in/UpdateEmailUseCase";

const {
	accessTokenCookieName,
	accessTokenMaxAgeSeconds,
	refreshTokenCookieName,
	refreshTokenMaxAgeSeconds,
} = sessionCookieConfig;

export function createPatchProfileEmailController(
	getCookieOptionsUseCase: GetCookieOptionsUseCase,
	createSessionTokenUseCase: CreateSessionTokenUseCase,
	updateEmailUseCase: UpdateEmailUseCase,
) {
	const controller = Controller();

	const patchProfileEmailRoute = createRoute({
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
	});

	controller.openapi(patchProfileEmailRoute, async (c) => {
		const user = requireApiUser(c.get("currentUser"));
		const values = c.req.valid("json");

		await updateEmailUseCase.updateEmail({
			email: values.email,
			userId: user.id,
		});

		if (values.email !== user.email && user.provider) {
			const { accessToken, refreshToken } =
				await createSessionTokenUseCase.create({
					email: values.email,
					provider: user.provider,
					role: user.role,
					userId: user.id,
				});

			setCookie(
				c,
				accessTokenCookieName,
				accessToken,
				getCookieOptionsUseCase.getCookieOptions(accessTokenMaxAgeSeconds),
			);
			setCookie(
				c,
				refreshTokenCookieName,
				refreshToken,
				getCookieOptionsUseCase.getCookieOptions(refreshTokenMaxAgeSeconds),
			);
		}

		return c.json({ ok: true } as const, 200);
	});

	return controller;
}
