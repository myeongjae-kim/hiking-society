import type { SessionTokensInput } from './SessionTokensInput';
import type { UserRole } from './roles';

export type LoginWithGoogleCodeResult = {
  session: SessionTokensInput;
  user: {
    email: string;
    id: number;
    role: UserRole;
  };
};
