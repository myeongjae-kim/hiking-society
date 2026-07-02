import type { UserRole } from '@/lib/db/schema';
import { jwtVerify, SignJWT, type JWTPayload } from 'jose';

const encoder = new TextEncoder();

export const accessTokenCookieName = 'access_token';
export const refreshTokenCookieName = 'refresh_token';
export const accessTokenMaxAgeSeconds = 60 * 15;
export const refreshTokenMaxAgeSeconds = 60 * 60 * 24 * 30;

type TokenBase = {
  exp: number;
  iat: number;
  userId: number;
};

export type AccessTokenPayload = TokenBase & {
  email: string;
  provider: string;
  role: UserRole;
  type: 'access';
};

export type RefreshTokenPayload = TokenBase & {
  type: 'refresh';
};

type SessionTokensInput = {
  email: string;
  provider: string;
  role: UserRole;
  userId: number;
};

function getSigningKey() {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required.');
  }

  return encoder.encode(jwtSecret);
}

function isAccessTokenPayload(payload: JWTPayload): payload is AccessTokenPayload {
  return (
    payload.type === 'access' &&
    typeof payload.userId === 'number' &&
    typeof payload.email === 'string' &&
    typeof payload.provider === 'string' &&
    typeof payload.role === 'string'
  );
}

function isRefreshTokenPayload(payload: JWTPayload): payload is RefreshTokenPayload {
  return payload.type === 'refresh' && typeof payload.userId === 'number';
}

async function signJwt(
  payload: Omit<AccessTokenPayload, 'exp' | 'iat'> | Omit<RefreshTokenPayload, 'exp' | 'iat'>,
  maxAge: number,
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(getSigningKey());
}

async function verifyJwt<T extends AccessTokenPayload | RefreshTokenPayload>(
  token: string,
  type: T['type'],
) {
  try {
    const { payload } = await jwtVerify(token, getSigningKey(), { algorithms: ['HS256'] });

    if (type === 'access' && isAccessTokenPayload(payload)) {
      return payload as T;
    }

    if (type === 'refresh' && isRefreshTokenPayload(payload)) {
      return payload as T;
    }
  } catch {
    return null;
  }

  return null;
}

export function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
}

export async function createSessionTokens(input: SessionTokensInput) {
  const accessToken = await signJwt(
    {
      email: input.email,
      provider: input.provider,
      role: input.role,
      type: 'access',
      userId: input.userId,
    },
    accessTokenMaxAgeSeconds,
  );
  const refreshToken = await signJwt(
    {
      type: 'refresh',
      userId: input.userId,
    },
    refreshTokenMaxAgeSeconds,
  );

  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string) {
  return verifyJwt<AccessTokenPayload>(token, 'access');
}

export function verifyRefreshToken(token: string) {
  return verifyJwt<RefreshTokenPayload>(token, 'refresh');
}
