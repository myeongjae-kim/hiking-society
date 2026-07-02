type AuthorBadgeProps = {
  name: string;
  profileImageUrl: string | null;
  size?: 'md' | 'sm';
};

function getInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || '?';
}

export function AuthorBadge({ name, profileImageUrl, size = 'sm' }: AuthorBadgeProps) {
  const avatarClassName = size === 'md' ? 'size-7 text-sm' : 'size-5 text-[0.6875rem]';
  const nameClassName = size === 'md' ? 'text-[var(--pink)]' : 'text-[var(--pink)]';

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 align-middle">
      {profileImageUrl ? (
        <img
          alt={`${name} 프로필 사진`}
          className={`${avatarClassName} shrink-0 rounded-full border border-[var(--overlay0)] object-cover`}
          src={profileImageUrl}
        />
      ) : (
        <span
          aria-label={`${name} 프로필 사진 없음`}
          className={`${avatarClassName} grid shrink-0 rounded-full border border-[var(--overlay0)] bg-[var(--background1)] font-mono leading-none text-[var(--blue)]`}
        >
          <span className="place-self-center">@{getInitial(name)}</span>
        </span>
      )}
      <span className={`min-w-0 whitespace-nowrap ${nameClassName}`}>@{name}</span>
    </span>
  );
}
