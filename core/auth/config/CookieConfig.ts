export class CookieConfig {
  public readonly accessTokenCookieName = 'access_token';
  public readonly refreshTokenCookieName = 'refresh_token';
  public readonly accessTokenMaxAgeSeconds = 60 * 15;
  public readonly refreshTokenMaxAgeSeconds = 60 * 60 * 24 * 180;
}
