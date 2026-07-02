import { AuthenticatedUser } from '@/core/auth/model/AuthenticatedUser';

export interface AuthQueryPort {
  getUserByUserId(userId: number): Promise<AuthenticatedUser | null>;
}
