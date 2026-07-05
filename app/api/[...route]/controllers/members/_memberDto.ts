export function toMemberDto(member: {
  createdAt: Date;
  displayName: string | null;
  email: string | null;
  id: number;
  lastLoginAt: Date | null;
  name: string | null;
  provider: string | null;
  role: string;
}) {
  return {
    ...member,
    createdAt: member.createdAt.toISOString(),
    lastLoginAt: member.lastLoginAt?.toISOString() ?? null,
  };
}
