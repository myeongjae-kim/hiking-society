import { z } from "zod";
import { mutableRoles } from "./roles";
import type { UserRole } from "./roles";

export const userRoleSchema = z.enum(mutableRoles) satisfies z.ZodType<UserRole>;
