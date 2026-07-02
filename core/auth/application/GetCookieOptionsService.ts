import { GetCookieOptionsUseCase } from './port/in/GetCookieOptionsUseCase';

export class GetCookieOptionsService implements GetCookieOptionsUseCase {
  getCookieOptions(maxAge: number) {
    return {
      httpOnly: true,
      maxAge,
      path: '/',
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
    } as const;
  }
}
