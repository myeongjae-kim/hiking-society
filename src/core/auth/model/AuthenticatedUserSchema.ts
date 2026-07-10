import { z } from "zod";
import { isoDateTimeStringSchema } from "@/core/common/domain/CommonSchema";
import type { AuthenticatedUser } from "./AuthenticatedUser";
import { userRoleSchema } from "./UserRoleSchema";

export const authenticatedUserSchema = z.object({
	displayName: z.string().nullable(),
	email: z.string(),
	id: z.number().int(),
	lastLoginAt: isoDateTimeStringSchema.nullable(),
	name: z.string().nullable(),
	profileImageUrl: z.string().nullable(),
	provider: z.string().nullable(),
	role: userRoleSchema,
}) satisfies z.ZodType<AuthenticatedUser>;
