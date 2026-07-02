'use server';

import { setSessionCookies } from '@/app/auth/actions/session';
import { type UserRole } from '@/core/auth/model/roles';
import { applicationContext } from '@/core/config/applicationContext';

type GoogleLoginResult = {
  ok: true;
  user: {
    email: string;
    id: number;
    role: UserRole;
  };
};

export const loginWithGoogleCode = async (code: string): Promise<GoogleLoginResult> => {
  const now = new Date();
  const result = await applicationContext().get('LoginWithGoogleCodeUseCase').login({ code, now });

  await setSessionCookies(result.session);

  return {
    ok: true,
    user: result.user,
  };
};
