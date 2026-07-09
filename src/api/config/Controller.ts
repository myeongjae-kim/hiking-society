import { OpenAPIHono } from "@hono/zod-openapi";
import type { AuthenticatedUser } from "@/core/auth/model/AuthenticatedUser";

export type ApiVariables = {
	currentUser: AuthenticatedUser | null;
};

export const Controller = <T extends object = object>() =>
	new OpenAPIHono<{ Variables: ApiVariables & T }>();
