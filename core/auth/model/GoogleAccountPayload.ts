export type GoogleAccountPayload = {
  displayName: string;
  email: string;
  emailVerified: boolean;
  profileImageUrl: string | null;
  provider: 'google';
  providerUserId: string;
  rawClaims: Record<string, unknown>;
};
