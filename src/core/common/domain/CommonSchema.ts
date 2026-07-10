import { z } from "zod";
import type {
	Altitude,
	AuthorName,
	IsoDateString,
	IsoDateTimeString,
	Latitude,
	Longitude,
	Timezone,
} from ".";

export function typedSchema<T>(schema: z.ZodType): z.ZodType<T> {
	return schema as unknown as z.ZodType<T>;
}

export const numericIdStringSchema = z.string().regex(/^\d+$/);

export const isoDateStringSchema = typedSchema<IsoDateString>(
	z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
);

export const isoDateTimeStringSchema = typedSchema<IsoDateTimeString>(
	z.string().min(1),
);

export const timezoneSchema = typedSchema<Timezone>(z.string().min(1));
export const altitudeSchema = typedSchema<Altitude>(z.number().finite());
export const latitudeSchema = typedSchema<Latitude>(z.number().finite());
export const longitudeSchema = typedSchema<Longitude>(z.number().finite());
export const authorNameSchema = typedSchema<AuthorName>(z.string());
