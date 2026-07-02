import { RefreshTokenPayload } from '@/core/auth/model/TokenPayload';

export interface VerifyRefreshTokenUseCase {
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null>;
}
