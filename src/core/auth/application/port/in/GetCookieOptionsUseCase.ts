export interface GetCookieOptionsUseCase {
	getCookieOptions(maxAge: number): {
		httpOnly: true;
		maxAge: number;
		path: "/";
		sameSite: "lax";
		secure: boolean;
	};
}
