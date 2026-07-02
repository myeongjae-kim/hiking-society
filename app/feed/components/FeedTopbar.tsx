import Link from 'next/link';

import { Command } from '@/app/common/components/Command';
import type { AuthenticatedUser } from '@/core/auth/model/AuthenticatedUser';
import { roleLabels } from '@/core/auth/model/roleLabels';
import type { AuthorName } from '@/core/common/domain';

type FeedTopbarProps = {
  currentAuthorName: AuthorName;
  user: AuthenticatedUser;
};

export function FeedTopbar({ currentAuthorName, user }: FeedTopbarProps) {
  return (
    <header className="border-b border-[var(--overlay0)] bg-[color-mix(in_srgb,var(--background0)_92%,transparent)] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <Command>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="">
            대학생(?)등산동아리
          </a>{' '}
          /feed
        </Command>
        <nav className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs leading-[1.4] text-[var(--subtext0)]">
            {String(currentAuthorName)} · {roleLabels[user.role]}
          </span>
          <Link is-="button" size-="small" variant-="foreground1" href="/me">
            마이페이지
          </Link>
        </nav>
      </div>
    </header>
  );
}
