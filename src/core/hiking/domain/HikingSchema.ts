import { z } from "zod";
import {
	altitudeSchema,
	authorNameSchema,
	isoDateStringSchema,
	isoDateTimeStringSchema,
	latitudeSchema,
	longitudeSchema,
	numericIdStringSchema,
	timezoneSchema,
	typedSchema,
} from "@/core/common/domain/CommonSchema";
import type { Hiking, HikingId } from "./Hiking";

export const hikingIdSchema = typedSchema<HikingId>(numericIdStringSchema);

export const hikingSchema = z.object({
	altitude: altitudeSchema.nullable(),
	authorName: authorNameSchema,
	authorUserId: z.number().int().optional(),
	completedAt: isoDateTimeStringSchema,
	createdAt: isoDateTimeStringSchema,
	hikingDate: isoDateStringSchema,
	id: hikingIdSchema,
	latitude: latitudeSchema,
	longitude: longitudeSchema,
	mountainName: z.string(),
	order: z.number().int(),
	participantsCsv: z.string(),
	restaurantAddress: z.string().nullable(),
	startedAt: isoDateTimeStringSchema,
	timezone: timezoneSchema,
	updatedAt: isoDateTimeStringSchema,
}) satisfies z.ZodType<Hiking>;
