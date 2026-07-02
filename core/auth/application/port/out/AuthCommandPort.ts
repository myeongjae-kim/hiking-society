import type { GoogleAccountPayload } from '@/core/auth/model/GoogleAccountPayload';
import type { UserRole } from '@/core/auth/model/roles';

export interface AuthCommandPort {
  upsertGoogleAccount(input: { now: Date; payload: GoogleAccountPayload }): Promise<{
    email: string;
    id: number;
    role: UserRole;
  }>;
}
