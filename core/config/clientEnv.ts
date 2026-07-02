import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_GOOGLE_LOGIN_CLIENT_ID: z.string(),
});

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_GOOGLE_LOGIN_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_LOGIN_CLIENT_ID,
});
