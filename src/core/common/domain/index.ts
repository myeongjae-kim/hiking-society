export type Brand<T, TBrand extends string> = T & {
	readonly __brand: TBrand;
};

export type IsoDateString = Brand<string, "IsoDateString">;

export type IsoDateTimeString = Brand<string, "IsoDateTimeString">;

export function toIsoDateTime(value: Date): IsoDateTimeString;
export function toIsoDateTime(value: null): null;
export function toIsoDateTime(value: Date | null): IsoDateTimeString | null;
export function toIsoDateTime(
	value: Date | null,
): IsoDateTimeString | null {
	return value ? (value.toISOString() as IsoDateTimeString) : null;
}

export type Timezone = Brand<string, "Timezone">;

export type Altitude = Brand<number, "Altitude">;

export type Latitude = Brand<number, "Latitude">;

export type Longitude = Brand<number, "Longitude">;

export type AuthorName = Brand<string, "AuthorName">;
