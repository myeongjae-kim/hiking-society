import { applicationContext } from '@/core/config/applicationContext.server';

export const sessionCookieConfig = applicationContext().get('CookieConfig');

export function cookieOptions(maxAge: number) {
  return applicationContext().get('GetCookieOptionsUseCase').getCookieOptions(maxAge);
}
