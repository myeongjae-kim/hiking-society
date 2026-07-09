export class CookieConfig {
	public readonly accessTokenCookieName = "hiking_access_token";
	public readonly refreshTokenCookieName = "hiking_refresh_token";
	public readonly accessTokenMaxAgeSeconds = 60 * 15;
	public readonly refreshTokenMaxAgeSeconds = 60 * 60 * 24 * 180;
}
