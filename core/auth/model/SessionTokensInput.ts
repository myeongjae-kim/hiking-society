import type { UserRole } from '@/lib/db/schema';

export type SessionTokensInput = {
  email: string;
  provider: string;
  role: UserRole;
  userId: number;
};
