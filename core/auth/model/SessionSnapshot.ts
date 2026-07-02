import type { UserRole } from './roles';

export type SessionSnapshot = {
  email: string;
  provider: string;
  role: UserRole;
  userId: number;
};
