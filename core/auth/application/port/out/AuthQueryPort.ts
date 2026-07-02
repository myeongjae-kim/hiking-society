import { AuthenticatedUser } from '@/core/auth/model/AuthenticatedUser';
import { SessionSnapshot } from '@/core/auth/model/SessionSnapshot';

export interface AuthQueryPort {
  getSessionSnapshotByUserId(userId: number): Promise<SessionSnapshot | null>;
  getUserByUserId(userId: number): Promise<AuthenticatedUser | null>;
}
