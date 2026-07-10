export type SessionCookieOptions = {
	readonly httpOnly: true;
	readonly maxAge: number;
	readonly path: "/";
	readonly sameSite: "lax";
	readonly secure: boolean;
};

export type SessionCookieOptionsFactory = (
	maxAge: number,
) => SessionCookieOptions;

export function createSessionCookieOptionsFactory(
	nodeEnv: typeof process.env.NODE_ENV,
): SessionCookieOptionsFactory {
	return (maxAge) => ({
		httpOnly: true,
		maxAge,
		path: "/",
		sameSite: "lax",
		secure: nodeEnv === "production",
	});
}
