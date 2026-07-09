import { createRoute } from "@hono/zod-openapi";
import { setCookie } from "hono/cookie";
import { ApiError } from "#/api/config/ApiError";
import { Controller } from "#/api/config/Controller";
import { currentUserSchema, loginWithGoogleBodySchema } from "#/api/schemas";
import type { LoginWithGoogleCodeResult } from "@/core/auth/model/LoginWithGoogleCodeResult";
import { applicationUseCaseContext } from "@/core/config/applicationUseCases.server";
import { cookieOptions, sessionCookieConfig } from "../../../_sessionCookies";

const controller = Controller();
const {
	accessTokenCookieName,
	accessTokenMaxAgeSeconds,
	refreshTokenCookieName,
	refreshTokenMaxAgeSeconds,
} = sessionCookieConfig;

controller.openapi(
	createRoute({
		method: "post",
		path: "/auth/google/login",
		request: {
			body: {
				content: { "application/json": { schema: loginWithGoogleBodySchema } },
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
	}),
	async (c) => {
		let result: LoginWithGoogleCodeResult;

		try {
			result = await applicationUseCaseContext()
				.get("LoginWithGoogleCodeUseCase")
				.login({
					code: c.req.valid("json").code,
					now: new Date(),
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
		const { accessToken, refreshToken } = await applicationUseCaseContext()
			.get("CreateSessionTokenUseCase")
			.create(result.session);

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

		return c.json(currentUserSchema.parse(result.user), 200);
	},
);

export default controller;
