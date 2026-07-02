'use server';

import { env } from '@/core/config/env';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
  env.NEXT_PUBLIC_GOOGLE_LOGIN_CLIENT_ID,
  env.GOOGLE_LOGIN_CLIENT_SECRET,
  'postmessage',
);

export const fetchPayloadFromGoogle = async (tokenResponse: { code: string }) => {
  const { tokens } = await client.getToken(tokenResponse.code);

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: env.NEXT_PUBLIC_GOOGLE_LOGIN_CLIENT_ID,
  });

  return ticket.getPayload();
};
