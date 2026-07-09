import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { env } from './core/config/env.server';

export default defineConfig({
  out: './drizzle',
  schema: './lib/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
