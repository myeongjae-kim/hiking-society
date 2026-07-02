import type { User } from '@/lib/db/schema';

export type AuthenticatedUser = Pick<
  User,
  'displayName' | 'email' | 'id' | 'lastLoginAt' | 'name' | 'profileImageUrl' | 'role'
> & {
  provider: string | null;
};
