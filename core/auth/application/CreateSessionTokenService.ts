import { Autowired } from '@/core/config/Autowired';
import { SignJWT } from 'jose';
import { CookieConfig } from '../config/CookieConfig';
import { SessionTokensInput } from '../model/SessionTokensInput';
import { AccessTokenPayload, RefreshTokenPayload } from '../model/TokenPayload';
import { CreateSessionTokenUseCase } from './port/in/CreateSessionTokenUseCase';

export class CreateSessionTokenService implements CreateSessionTokenUseCase {
  constructor(
    @Autowired('TextEncoder')
    private encoder: TextEncoder,
    @Autowired('CookieConfig')
    private cookieConfig: CookieConfig,
  ) {}

  async create(input: SessionTokensInput): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signJwt(
        {
          email: input.email,
          provider: input.provider,
          role: input.role,
          type: 'access',
          userId: input.userId,
        },
        this.cookieConfig.accessTokenMaxAgeSeconds,
      ),
      this.signJwt(
        {
          type: 'refresh',
          userId: input.userId,
        },
        this.cookieConfig.refreshTokenMaxAgeSeconds,
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private getSigningKey() {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is required.');
    }

    return this.encoder.encode(jwtSecret);
  }

  private async signJwt(
    payload: Omit<AccessTokenPayload, 'exp' | 'iat'> | Omit<RefreshTokenPayload, 'exp' | 'iat'>,
    maxAge: number,
  ) {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime(`${maxAge}s`)
      .sign(this.getSigningKey());
  }
}
