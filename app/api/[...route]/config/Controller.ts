import type { AuthenticatedUser } from '@/core/auth/model/AuthenticatedUser';
import { OpenAPIHono } from '@hono/zod-openapi';

export type ApiVariables = {
  currentUser: AuthenticatedUser | null;
};

export const Controller = <T extends object = object>() =>
  new OpenAPIHono<{ Variables: ApiVariables & T }>();
