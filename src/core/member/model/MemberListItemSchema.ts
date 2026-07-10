import { z } from "zod";
import { userRoleSchema } from "@/core/auth/model/UserRoleSchema";
import { isoDateTimeStringSchema } from "@/core/common/domain/CommonSchema";
import type { MemberListItem } from "./MemberListItem";

export const memberListItemSchema = z.object({
	createdAt: isoDateTimeStringSchema,
	displayName: z.string().nullable(),
	email: z.string().nullable(),
	id: z.number().int(),
	lastLoginAt: isoDateTimeStringSchema.nullable(),
	name: z.string().nullable(),
	provider: z.string().nullable(),
	role: userRoleSchema,
}) satisfies z.ZodType<MemberListItem>;
