export function getSingleSearchParam(value: unknown) {
	const param = Array.isArray(value) ? value[0] : value;

	return typeof param === "string" ? param : undefined;
}

export function toNumericSearchId<T extends string>(value: unknown) {
	const param = getSingleSearchParam(value);

	return param && /^\d+$/.test(param) ? (param as T) : null;
}
