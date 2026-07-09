import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_GOOGLE_LOGIN_CLIENT_ID: z.string(),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  GOOGLE_LOGIN_CLIENT_SECRET: z.string(),
  S3_ACCESS_KEY_ID: z.string(),
  S3_BUCKET: z.string(),
  S3_ENDPOINT: z.string().url(),
  S3_PUBLIC_BASE_URL: z.string().url(),
  S3_REGION: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
