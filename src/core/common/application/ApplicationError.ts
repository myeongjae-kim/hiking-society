export type ApplicationErrorCode =
	| "BAD_REQUEST"
	| "CONFLICT"
	| "FORBIDDEN"
	| "NOT_FOUND"
	| "UNAUTHORIZED";

export class ApplicationError extends Error {
	readonly code: ApplicationErrorCode;

	constructor(code: ApplicationErrorCode, message: string) {
		super(message);
		this.code = code;
	}
}

export const applicationError = {
	badRequest: (message: string) => new ApplicationError("BAD_REQUEST", message),
	conflict: (message: string) => new ApplicationError("CONFLICT", message),
	forbidden: (message: string) => new ApplicationError("FORBIDDEN", message),
	notFound: (message: string) => new ApplicationError("NOT_FOUND", message),
	unauthorized: (message: string) =>
		new ApplicationError("UNAUTHORIZED", message),
} as const;
