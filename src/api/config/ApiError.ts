import { z } from "@hono/zod-openapi";

export class ApiError extends Error {
	public readonly code: string;
	public readonly error: string;
	public readonly status: number;

	constructor(input: {
		code?: string;
		error: string;
		message: string;
		status: number;
	}) {
		super(input.message);
		this.code = input.code ?? "";
		this.error = input.error;
		this.status = input.status;
	}
}

export const apiErrorSchema = z
	.object({
		code: z.string(),
		error: z.string(),
		message: z.string(),
		status: z.number().int(),
	})
	.openapi("ApiError");

export function toApiErrorBody(error: ApiError) {
	return {
		code: error.code,
		error: error.error,
		message: error.message,
		status: error.status,
	};
}
