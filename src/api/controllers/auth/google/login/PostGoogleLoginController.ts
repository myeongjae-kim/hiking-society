import { createRoute } from "@hono/zod-openapi";
import { setCookie } from "hono/cookie";
import { ApiError } from "#/api/config/ApiError";
import { Controller } from "#/api/config/Controller";
import { sessionCookieConfig } from "#/api/config/sessionCookies";
import { currentUserSchema, loginWithGoogleBodySchema } from "#/api/schemas";
import type { LoginWithGoogleCodeResult } from "@/core/auth/model/LoginWithGoogleCodeResult";
import type { GetCookieOptionsUseCase } from "@/core/auth/application/port/in/GetCookieOptionsUseCase";
import type { CreateSessionTokenUseCase } from "@/core/auth/application/port/in/CreateSessionTokenUseCase";
import type { LoginWithGoogleCodeUseCase } from "@/core/auth/application/port/in/LoginWithGoogleCodeUseCase";

const {
	accessTokenCookieName,
	accessTokenMaxAgeSeconds,
	refreshTokenCookieName,
	refreshTokenMaxAgeSeconds,
} = sessionCookieConfig;

export function createPostGoogleLoginController(
	getCookieOptionsUseCase: GetCookieOptionsUseCase,
	createSessionTokenUseCase: CreateSessionTokenUseCase,
	loginWithGoogleCodeUseCase: LoginWithGoogleCodeUseCase,
) {
	const controller = Controller();

	const postGoogleLoginRoute = createRoute({
		method: "post",
		path: "/auth/google/login",
		request: {
			body: {
				content: {
					"application/json": { schema: loginWithGoogleBodySchema },
				},
				required: true,
			},
		},
		responses: {
			200: {
				content: { "application/json": { schema: currentUserSchema } },
				description: "Logged in user",
			},
		},
		tags: ["auth"],
	});

	controller.openapi(postGoogleLoginRoute, async (c) => {
		let result: LoginWithGoogleCodeResult;

		try {
			result = await loginWithGoogleCodeUseCase.login({
				code: c.req.valid("json").code,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : "";

			if (message === "invalid_grant") {
				throw new ApiError({
					error: "GOOGLE_LOGIN_FAILED",
					message:
						"Google 로그인 코드가 올바르지 않거나 만료되었습니다. 다시 시도해주세요.",
					status: 400,
				});
			}

			throw error;
		}
		const { accessToken, refreshToken } =
			await createSessionTokenUseCase.create(result.session);

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

		return c.json(currentUserSchema.parse(result.user), 200);
	});

	return controller;
}
